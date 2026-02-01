# DeliveryApp - Refactor con Supabase

Aplicación de delivery con React + TypeScript + Vite + Tailwind + Supabase.

## 🚀 Características

- ✅ Autenticación con Supabase Auth
- ✅ Base de datos PostgreSQL con RLS (Row Level Security)
- ✅ Realtime updates para pedidos y chat
- ✅ Mapas con Leaflet y GPS tracking
- ✅ Geocoding con Nominatim (OpenStreetMap)
- ✅ Pagos con Mercado Pago Checkout Pro
- ✅ Chat en tiempo real
- ✅ Historial y resumen financiero
- ✅ Modo dual: Cliente y Delivery

## 📁 Estructura del Proyecto

```
src/
├── components/
│   ├── common/        # Toast, Button, Modal
│   ├── maps/          # MapaUbicacion, MapaTracking, MiniMapa
│   ├── cliente/       # FormularioNuevoPedido, ListaPedidos, DetallePedido
│   ├── delivery/      # PedidosDisponibles, PedidosActivos
│   └── chat/          # ChatInterface
├── hooks/
│   ├── useAuth.ts
│   ├── useGeolocation.ts
│   ├── usePedidos.ts
│   └── useToast.ts
├── services/
│   ├── supabase.ts    # Cliente y funciones de Supabase
│   ├── geocoding.ts   # Nominatim API
│   ├── mercadopago.ts # Mercado Pago SDK
│   └── api.ts         # Funciones de alto nivel
├── contexts/
│   ├── AuthContext.tsx
│   └── PedidosContext.tsx
├── types/
│   └── index.ts       # Tipos TypeScript
├── utils/
│   ├── constants.ts
│   └── helpers.ts
├── App.tsx
└── main.tsx
```

## 🛠️ Instalación

1. Clonar el repositorio
2. Instalar dependencias:
   ```bash
   npm install
   ```

3. Configurar variables de entorno:
   ```bash
   cp .env.example .env
   ```
   Editar `.env` con tus credenciales de Supabase y Mercado Pago.

4. Configurar Supabase:
   - Crear proyecto en [supabase.com](https://supabase.com)
   - Ejecutar el schema SQL en `supabase/schema.sql`
   - Habilitar Auth con email/password

5. Iniciar el servidor de desarrollo:
   ```bash
   npm run dev
   ```

## 🗄️ Base de Datos

### Tablas

- **usuarios**: Perfiles de usuario
- **pedidos**: Pedidos de delivery
- **mensajes**: Chat entre cliente y delivery
- **tracking**: Ubicaciones del delivery
- **transacciones**: Pagos procesados

### RLS (Row Level Security)

Cada tabla tiene políticas de seguridad que garantizan que:
- Los usuarios solo ven sus propios datos
- Los deliveries pueden ver pedidos pendientes
- Solo los participantes de un pedido pueden ver su chat

## 🔑 Environment Variables

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_MP_PUBLIC_KEY=TEST-xxx
```

## 📦 Scripts

- `npm run dev` - Servidor de desarrollo
- `npm run build` - Build de producción
- `npm run preview` - Preview del build
- `npm run lint` - Linter

## 🗺️ APIs Externas

- **Nominatim**: Geocoding gratuito de OpenStreetMap
- **Mercado Pago**: Procesamiento de pagos
- **Leaflet**: Mapas interactivos

## 📱 Modos de Uso

### Modo Cliente
- Crear pedidos con geocoding automático
- Ver tracking en vivo del delivery
- Chat con el repartidor
- Historial de pedidos

### Modo Delivery
- Ver ubicación GPS propia
- Aceptar pedidos disponibles
- Completar entregas
- Procesar pagos
- Historial de entregas

## 🔒 Seguridad

- Autenticación con Supabase Auth
- RLS en todas las tablas
- Validación de datos en frontend y backend
- Tokens JWT para API calls

## 📄 Licencia

MIT
