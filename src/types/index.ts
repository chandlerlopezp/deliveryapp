// ============================================================================
// TYPES - Definiciones de tipos para DeliveryApp
// ============================================================================

export interface Coordenadas {
  lat: number;
  lng: number;
}

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  calificacion: number;
  role: 'cliente' | 'delivery';
  aliasMP?: string;
  created_at: string;
}

export interface Pedido {
  id: string;
  origen: string;
  destino: string;
  descripcion: string;
  precio: number;
  metodo_pago: 'efectivo' | 'tarjeta';
  coord_origen: Coordenadas;
  coord_destino: Coordenadas;
  distancia: number;
  tiempo_estimado: number;
  estado: 'pendiente' | 'en-camino' | 'completado' | 'cancelado';
  estado_pago: 'pendiente' | 'pagado';
  cliente_id: string;
  cliente_nombre?: string;
  delivery_id?: string;
  delivery_nombre?: string;
  created_at: string;
  aceptado_at?: string;
  completado_at?: string;
  cancelado_at?: string;
  pago_completado_at?: string;
}

export interface Mensaje {
  id: string;
  pedido_id: string;
  usuario_id: string;
  texto: string;
  nombre_usuario: string;
  timestamp: string;
}

export interface TrackingPoint {
  id: string;
  pedido_id: string;
  delivery_id: string;
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: string;
}

export interface Transaccion {
  id: string;
  pedido_id: string;
  monto: number;
  metodo: 'efectivo' | 'tarjeta';
  status: 'pendiente' | 'completado' | 'fallido';
  mp_preference_id?: string;
  mp_collection_id?: string;
  created_at: string;
}

export interface LocationData {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: Date;
  isFallback: boolean;
}

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

export interface NuevoPedido {
  origen: string;
  destino: string;
  descripcion: string;
  precio: string;
  metodoPago: 'efectivo' | 'tarjeta';
  coordOrigen: Coordenadas | null;
  coordDestino: Coordenadas | null;
  displayOrigen: string;
  displayDestino: string;
}

export interface LoginData {
  email: string;
  password: string;
  nombre: string;
  telefono: string;
  isRegistering: boolean;
}

export interface GeocodingResult {
  lat: number;
  lng: number;
  displayName: string;
}

export interface ResumenFinanciero {
  totalGastado: number;
  totalGanado: number;
  pedidosCompletados: number;
  entregasCompletadas: number;
  distanciaTotal: number;
}

export type UserMode = 'cliente' | 'delivery' | null;

export type TabCliente = 'nuevo' | 'mis-pedidos' | 'historial';
export type TabDelivery = 'disponibles' | 'mis-entregas' | 'historial';
