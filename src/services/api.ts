// ============================================================================
// API SERVICE - Funciones de API centralizadas
// ============================================================================

import { 
  pedidosService, 
  mensajesService, 
  trackingService, 
  transaccionesService,
  authService 
} from './supabase';
import { geocodificarDireccion } from './geocoding';
import * as mercadoPagoService from './mercadopago';
import { Pedido, Mensaje, Usuario, NuevoPedido, Coordenadas } from '../types';
import { calcularDistancia, calcularTiempoEstimado } from '../utils/helpers';

// ============================================================================
// RE-EXPORT SERVICES
// ============================================================================

export { authService, pedidosService, mensajesService, trackingService, transaccionesService };
export { geocodificarDireccion };
export { mercadoPagoService };

// ============================================================================
// FUNCIONES DE ALTO NIVEL
// ============================================================================

/**
 * Crea un nuevo pedido completo con geocodificación
 */
export const crearPedidoCompleto = async (
  nuevoPedido: NuevoPedido,
  cliente: Usuario
): Promise<Pedido> => {
  // Validar coordenadas
  if (!nuevoPedido.coordOrigen || !nuevoPedido.coordDestino) {
    throw new Error('Las direcciones deben ser geocodificadas primero');
  }

  // Calcular distancia y tiempo
  const distancia = calcularDistancia(nuevoPedido.coordOrigen, nuevoPedido.coordDestino);
  const tiempoEstimado = calcularTiempoEstimado(distancia);

  // Crear pedido
  const pedido = await pedidosService.crear({
    origen: nuevoPedido.origen,
    destino: nuevoPedido.destino,
    descripcion: nuevoPedido.descripcion,
    precio: parseFloat(nuevoPedido.precio),
    metodo_pago: nuevoPedido.metodoPago,
    coord_origen: nuevoPedido.coordOrigen,
    coord_destino: nuevoPedido.coordDestino,
    distancia: parseFloat(distancia.toFixed(1)),
    tiempo_estimado: tiempoEstimado,
    estado: 'pendiente',
    estado_pago: 'pendiente',
    cliente_id: cliente.id,
    cliente_nombre: cliente.nombre
  });

  return pedido;
};

/**
 * Acepta un pedido como delivery
 */
export const aceptarPedidoComoDelivery = async (
  pedidoId: string,
  delivery: Usuario,
  ubicacionActual: Coordenadas
): Promise<Pedido> => {
  // Actualizar pedido
  const pedido = await pedidosService.aceptar(pedidoId, delivery.id, delivery.nombre);

  // Guardar tracking inicial
  await trackingService.guardar({
    pedido_id: pedidoId,
    delivery_id: delivery.id,
    lat: ubicacionActual.lat,
    lng: ubicacionActual.lng,
    accuracy: 10,
    timestamp: new Date().toISOString()
  });

  return pedido;
};

/**
 * Completa un pedido y procesa el pago
 */
export const completarPedidoYProcesarPago = async (
  pedidoId: string,
  metodoPago: 'efectivo' | 'tarjeta'
): Promise<{ pedido: Pedido; transaccion?: any }> => {
  // Completar pedido
  const pedido = await pedidosService.completar(pedidoId);

  // Si es efectivo, marcar como pagado directamente
  if (metodoPago === 'efectivo') {
    await pedidosService.marcarPagado(pedidoId);
    return { pedido };
  }

  // Si es tarjeta, crear transacción pendiente
  const transaccion = await transaccionesService.crear({
    pedido_id: pedidoId,
    monto: pedido.precio,
    metodo: 'tarjeta',
    status: 'pendiente'
  });

  return { pedido, transaccion };
};

/**
 * Procesa un pago con Mercado Pago
 */
export const procesarPagoMercadoPago = async (
  pedido: Pedido,
  onProgress?: (step: string) => void
): Promise<boolean> => {
  try {
    // Crear preferencia
    const preferenceId = await mercadoPagoService.crearPreferenciaPago(pedido);
    
    // Simular pago (en producción, el usuario sería redirigido a MP)
    const resultado = await mercadoPagoService.simularPago(pedido.id, onProgress);
    
    if (resultado.success) {
      // Marcar pedido como pagado
      await pedidosService.marcarPagado(pedido.id);
      
      // Actualizar transacción
      const transaccion = await transaccionesService.obtenerPorPedido(pedido.id);
      if (transaccion) {
        await transaccionesService.actualizar(transaccion.id, {
          status: 'completado',
          mp_preference_id: preferenceId,
          mp_collection_id: resultado.transactionId
        });
      }
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error procesando pago:', error);
    throw error;
  }
};

/**
 * Obtiene el resumen financiero de un usuario
 */
export const obtenerResumenFinanciero = async (
  userId: string,
  role: 'cliente' | 'delivery'
): Promise<{
  totalGastado: number;
  totalGanado: number;
  pedidosCompletados: number;
  entregasCompletadas: number;
  distanciaTotal: number;
}> => {
  let pedidos: Pedido[];

  if (role === 'cliente') {
    pedidos = await pedidosService.obtenerPorCliente(userId);
  } else {
    pedidos = await pedidosService.obtenerPorDelivery(userId);
  }

  const completados = pedidos.filter(p => p.estado === 'completado');

  return {
    totalGastado: role === 'cliente' 
      ? completados.reduce((sum, p) => sum + p.precio, 0) 
      : 0,
    totalGanado: role === 'delivery' 
      ? completados.reduce((sum, p) => sum + p.precio, 0) 
      : 0,
    pedidosCompletados: role === 'cliente' ? completados.length : 0,
    entregasCompletadas: role === 'delivery' ? completados.length : 0,
    distanciaTotal: role === 'delivery' 
      ? completados.reduce((sum, p) => sum + p.distancia, 0) 
      : 0
  };
};

/**
 * Envía un mensaje en el chat de un pedido
 */
export const enviarMensajeChat = async (
  pedidoId: string,
  usuario: Usuario,
  texto: string
): Promise<Mensaje> => {
  const mensaje = await mensajesService.enviar({
    pedido_id: pedidoId,
    usuario_id: usuario.id,
    texto: texto.trim(),
    nombre_usuario: usuario.nombre,
    timestamp: new Date().toISOString()
  });

  return mensaje;
};

/**
 * Actualiza la ubicación del delivery
 */
export const actualizarUbicacionDelivery = async (
  pedidoId: string,
  deliveryId: string,
  ubicacion: { lat: number; lng: number; accuracy: number }
): Promise<void> => {
  await trackingService.guardar({
    pedido_id: pedidoId,
    delivery_id: deliveryId,
    lat: ubicacion.lat,
    lng: ubicacion.lng,
    accuracy: ubicacion.accuracy,
    timestamp: new Date().toISOString()
  });
};

export default {
  authService,
  pedidosService,
  mensajesService,
  trackingService,
  transaccionesService,
  geocodificarDireccion,
  mercadoPagoService,
  crearPedidoCompleto,
  aceptarPedidoComoDelivery,
  completarPedidoYProcesarPago,
  procesarPagoMercadoPago,
  obtenerResumenFinanciero,
  enviarMensajeChat,
  actualizarUbicacionDelivery
};
