-- ============================================================================
-- SUPABASE SCHEMA - Tablas para DeliveryApp
-- ============================================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLA: usuarios
-- ============================================================================
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  telefono TEXT NOT NULL,
  calificacion DECIMAL(3,2) DEFAULT 5.0,
  role TEXT DEFAULT 'cliente' CHECK (role IN ('cliente', 'delivery')),
  alias_mp TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS para usuarios
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON usuarios
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON usuarios
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON usuarios
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================================================
-- TABLA: pedidos
-- ============================================================================
CREATE TABLE IF NOT EXISTS pedidos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  origen TEXT NOT NULL,
  destino TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  precio DECIMAL(10,2) NOT NULL,
  metodo_pago TEXT DEFAULT 'efectivo' CHECK (metodo_pago IN ('efectivo', 'tarjeta')),
  coord_origen_lat DECIMAL(10,8) NOT NULL,
  coord_origen_lng DECIMAL(11,8) NOT NULL,
  coord_destino_lat DECIMAL(10,8) NOT NULL,
  coord_destino_lng DECIMAL(11,8) NOT NULL,
  distancia DECIMAL(6,2) NOT NULL,
  tiempo_estimado INTEGER NOT NULL,
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en-camino', 'completado', 'cancelado')),
  estado_pago TEXT DEFAULT 'pendiente' CHECK (estado_pago IN ('pendiente', 'pagado')),
  cliente_id UUID REFERENCES usuarios(id) NOT NULL,
  cliente_nombre TEXT,
  delivery_id UUID REFERENCES usuarios(id),
  delivery_nombre TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  aceptado_at TIMESTAMPTZ,
  completado_at TIMESTAMPTZ,
  cancelado_at TIMESTAMPTZ,
  pago_completado_at TIMESTAMPTZ
);

-- RLS para pedidos
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;

-- Todos pueden ver pedidos pendientes (para delivery)
CREATE POLICY "Anyone can view pending pedidos" ON pedidos
  FOR SELECT USING (estado = 'pendiente');

-- Clientes pueden ver sus propios pedidos
CREATE POLICY "Clients can view own pedidos" ON pedidos
  FOR SELECT USING (auth.uid() = cliente_id);

-- Deliveries pueden ver pedidos que aceptaron
CREATE POLICY "Delivery can view accepted pedidos" ON pedidos
  FOR SELECT USING (auth.uid() = delivery_id);

-- Clientes pueden crear pedidos
CREATE POLICY "Clients can create pedidos" ON pedidos
  FOR INSERT WITH CHECK (auth.uid() = cliente_id);

-- Clientes pueden cancelar sus pedidos pendientes
CREATE POLICY "Clients can cancel own pending pedidos" ON pedidos
  FOR UPDATE USING (auth.uid() = cliente_id AND estado = 'pendiente');

-- Deliveries pueden aceptar pedidos pendientes
CREATE POLICY "Delivery can accept pending pedidos" ON pedidos
  FOR UPDATE USING (estado = 'pendiente');

-- Deliveries pueden completar sus pedidos
CREATE POLICY "Delivery can complete own pedidos" ON pedidos
  FOR UPDATE USING (auth.uid() = delivery_id AND estado = 'en-camino');

-- ============================================================================
-- TABLA: mensajes
-- ============================================================================
CREATE TABLE IF NOT EXISTS mensajes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pedido_id UUID REFERENCES pedidos(id) ON DELETE CASCADE NOT NULL,
  usuario_id UUID REFERENCES usuarios(id) NOT NULL,
  texto TEXT NOT NULL,
  nombre_usuario TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- RLS para mensajes
ALTER TABLE mensajes ENABLE ROW LEVEL SECURITY;

-- Usuarios pueden ver mensajes de pedidos donde participan
CREATE POLICY "Users can view messages of their pedidos" ON mensajes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM pedidos 
      WHERE pedidos.id = mensajes.pedido_id 
      AND (pedidos.cliente_id = auth.uid() OR pedidos.delivery_id = auth.uid())
    )
  );

-- Usuarios pueden enviar mensajes en pedidos donde participan
CREATE POLICY "Users can send messages in their pedidos" ON mensajes
  FOR INSERT WITH CHECK (
    auth.uid() = usuario_id AND
    EXISTS (
      SELECT 1 FROM pedidos 
      WHERE pedidos.id = mensajes.pedido_id 
      AND (pedidos.cliente_id = auth.uid() OR pedidos.delivery_id = auth.uid())
    )
  );

-- ============================================================================
-- TABLA: tracking
-- ============================================================================
CREATE TABLE IF NOT EXISTS tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pedido_id UUID REFERENCES pedidos(id) ON DELETE CASCADE NOT NULL,
  delivery_id UUID REFERENCES usuarios(id) NOT NULL,
  lat DECIMAL(10,8) NOT NULL,
  lng DECIMAL(11,8) NOT NULL,
  accuracy DECIMAL(6,2) DEFAULT 10,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para consultas de tracking
CREATE INDEX IF NOT EXISTS idx_tracking_pedido_timestamp ON tracking(pedido_id, timestamp DESC);

-- RLS para tracking
ALTER TABLE tracking ENABLE ROW LEVEL SECURITY;

-- Clientes pueden ver tracking de sus pedidos
CREATE POLICY "Clients can view tracking of their pedidos" ON tracking
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM pedidos 
      WHERE pedidos.id = tracking.pedido_id 
      AND pedidos.cliente_id = auth.uid()
    )
  );

-- Deliveries pueden insertar tracking de sus pedidos
CREATE POLICY "Delivery can insert tracking" ON tracking
  FOR INSERT WITH CHECK (
    auth.uid() = delivery_id AND
    EXISTS (
      SELECT 1 FROM pedidos 
      WHERE pedidos.id = tracking.pedido_id 
      AND pedidos.delivery_id = auth.uid()
    )
  );

-- ============================================================================
-- TABLA: transacciones
-- ============================================================================
CREATE TABLE IF NOT EXISTS transacciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pedido_id UUID REFERENCES pedidos(id) ON DELETE CASCADE NOT NULL,
  monto DECIMAL(10,2) NOT NULL,
  metodo TEXT NOT NULL CHECK (metodo IN ('efectivo', 'tarjeta')),
  status TEXT DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'completado', 'fallido')),
  mp_preference_id TEXT,
  mp_collection_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS para transacciones
ALTER TABLE transacciones ENABLE ROW LEVEL SECURITY;

-- Usuarios pueden ver transacciones de sus pedidos
CREATE POLICY "Users can view transactions of their pedidos" ON transacciones
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM pedidos 
      WHERE pedidos.id = transacciones.pedido_id 
      AND (pedidos.cliente_id = auth.uid() OR pedidos.delivery_id = auth.uid())
    )
  );

-- Solo el sistema puede crear/actualizar transacciones (usando service role)
-- En producción, usar functions de Supabase con service role

-- ============================================================================
-- FUNCIONES Y TRIGGERS
-- ============================================================================

-- Función para actualizar cliente_nombre automáticamente
CREATE OR REPLACE FUNCTION update_cliente_nombre()
RETURNS TRIGGER AS $$
BEGIN
  SELECT nombre INTO NEW.cliente_nombre 
  FROM usuarios 
  WHERE id = NEW.cliente_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_cliente_nombre
  BEFORE INSERT ON pedidos
  FOR EACH ROW
  EXECUTE FUNCTION update_cliente_nombre();

-- Función para notificar cambios en pedidos (realtime)
CREATE OR REPLACE FUNCTION notify_pedido_change()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify('pedido_change', json_build_object(
    'id', NEW.id,
    'estado', NEW.estado,
    'cliente_id', NEW.cliente_id,
    'delivery_id', NEW.delivery_id
  )::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pedido_changed
  AFTER UPDATE ON pedidos
  FOR EACH ROW
  EXECUTE FUNCTION notify_pedido_change();

-- ============================================================================
-- HABILITAR REALTIME
-- ============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE pedidos;
ALTER PUBLICATION supabase_realtime ADD TABLE mensajes;
ALTER PUBLICATION supabase_realtime ADD TABLE tracking;
