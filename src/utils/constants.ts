// ============================================================================
// CONSTANTS - Constantes de la aplicación
// ============================================================================

// Coordenadas de General Villegas como fallback
export const VILLEGAS_CENTER = {
  lat: -35.0311,
  lng: -63.0128
};

// Configuración de Mercado Pago
export const MP_PUBLIC_KEY = import.meta.env.VITE_MP_PUBLIC_KEY || 'APP_USR-8fc04248-9f26-4093-8c11-2af07de2183f';

// Configuración de Supabase
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://imasjwhahjbjymfvmzff.supabase.co';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltYXNqd2hhaGpianltZnZtemZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5MzI2OTgsImV4cCI6MjA4NTUwODY5OH0.0rxNydhARONdnzkSCN5JqG1xmvXCcN63yMd5Qtt7_go';

// Respuestas automáticas para chat (demo)
export const AUTO_REPLIES = [
  "¡Perfecto! Ya estoy en camino 🏍️",
  "Llegando en aproximadamente 5 minutos",
  "Ya recogí el paquete, voy para allá",
  "Estoy cerca, ¿puedes salir a recibir?",
  "Todo bien, ya casi llego 👍",
  "Hay un poco de tráfico pero llego pronto",
  "¿Está correcta la dirección de entrega?",
  "Listo, entrega completada. ¡Gracias!",
  "Llegando en 2 minutos",
  "Ya estoy en la puerta"
];

// Configuración de GPS
export const GPS_OPTIONS = {
  enableHighAccuracy: true,
  timeout: 15000,
  maximumAge: 0
};

export const GPS_WATCH_OPTIONS = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 5000
};

// Configuración de tracking
export const TRACKING_UPDATE_INTERVAL = 10000; // 10 segundos
export const TRACKING_STEP_SIZE = 0.0008; // Tamaño del paso de simulación

// Colores de la aplicación
export const COLORS = {
  primary: {
    cliente: '#3B82F6', // blue-500
    delivery: '#8B5CF6' // purple-500
  },
  success: '#10B981', // green-500
  error: '#EF4444', // red-500
  warning: '#F59E0B', // orange-500
  info: '#3B82F6' // blue-500
};

// Estados de pedido
export const ESTADOS_PEDIDO = {
  PENDIENTE: 'pendiente',
  EN_CAMINO: 'en-camino',
  COMPLETADO: 'completado',
  CANCELADO: 'cancelado'
} as const;

// Estados de pago
export const ESTADOS_PAGO = {
  PENDIENTE: 'pendiente',
  PAGADO: 'pagado'
} as const;

// Métodos de pago
export const METODOS_PAGO = {
  EFECTIVO: 'efectivo',
  TARJETA: 'tarjeta'
} as const;
