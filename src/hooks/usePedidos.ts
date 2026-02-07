// ============================================================================
// USE PEDIDOS HOOK - Hook para manejo de pedidos
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { Pedido, Usuario, NuevoPedido, Coordenadas, ResumenFinanciero } from '../types';
import { pedidosService } from '../services/supabase';
import { calificacionesService } from '../services/supabase';
import { 
  crearPedidoCompleto, 
  aceptarPedidoComoDelivery, 
  completarPedidoYProcesarPago,
  obtenerResumenFinanciero 
} from '../services/api';


interface UsePedidosReturn {
  pedidos: Pedido[];
  pedidosDisponibles: Pedido[];
  misPedidos: Pedido[];
  misEntregas: Pedido[];
  historial: Pedido[];
  resumenFinanciero: ResumenFinanciero;
  isLoading: boolean;
  error: string | null;
  crearPedido: (nuevoPedido: NuevoPedido, cliente: Usuario) => Promise<Pedido>;
  aceptarPedido: (pedidoId: string, delivery: Usuario, ubicacion: Coordenadas) => Promise<void>;
  completarPedido: (pedidoId: string) => Promise<void>;
  cancelarPedido: (pedidoId: string) => Promise<void>;
  marcarPagado: (pedidoId: string) => Promise<void>;
  refetch: () => Promise<void>;
  verificarSiCalifique: (pedidoId: string) => Promise<boolean>;
  crearCalificacion: (pedidoId: string, calificadoId: string, puntuacion: number, comentario: string) => Promise<void>;
  }

export const usePedidos = (
  usuario: Usuario | null,
  userMode: 'cliente' | 'delivery' | null
): UsePedidosReturn => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resumenFinanciero, setResumenFinanciero] = useState<ResumenFinanciero>({
    totalGastado: 0,
    totalGanado: 0,
    pedidosCompletados: 0,
    entregasCompletadas: 0,
    distanciaTotal: 0
  });

  // Cargar pedidos
  const cargarPedidos = useCallback(async () => {
    if (!usuario) return;

    setIsLoading(true);
    setError(null);

    try {
      let pedidosData: Pedido[] = [];

      // Cargar pedidos disponibles para delivery
      if (userMode === 'delivery') {
        const disponibles = await pedidosService.obtenerDisponibles();
        const misEntregas = await pedidosService.obtenerPorDelivery(usuario.id);
        pedidosData = [...disponibles, ...misEntregas];
      } else {
        // Cargar pedidos del cliente
        pedidosData = await pedidosService.obtenerPorCliente(usuario.id);
      }

      setPedidos(pedidosData);

      // Cargar resumen financiero
      if (userMode) {
        const resumen = await obtenerResumenFinanciero(usuario.id, userMode);
        setResumenFinanciero(resumen);
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar pedidos');
      console.error('Error cargando pedidos:', err);
    } finally {
      setIsLoading(false);
    }
  }, [usuario, userMode]);

  // Cargar al montar y cuando cambie usuario/modo
  useEffect(() => {
    cargarPedidos();
  }, [cargarPedidos]);

  // Suscribirse a cambios en tiempo real
  useEffect(() => {
    if (!usuario) return;

    const subscription = pedidosService.subscribeToChanges((pedidoActualizado) => {
      setPedidos(prev => {
        const index = prev.findIndex(p => p.id === pedidoActualizado.id);
        if (index >= 0) {
          const newPedidos = [...prev];
          newPedidos[index] = pedidoActualizado;
          return newPedidos;
        }
        // Agregar nuevo pedido si no existe
        return [...prev, pedidoActualizado];
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [usuario]);

  // Filtros
  const pedidosDisponibles = pedidos.filter(p => p.estado === 'pendiente');
  
  const misPedidos = pedidos.filter(p => 
    p.cliente_id === usuario?.id && 
    ['pendiente', 'en-camino'].includes(p.estado)
  );
  
  const misEntregas = pedidos.filter(p => 
    p.delivery_id === usuario?.id && 
    ['en-camino'].includes(p.estado)
  );
  
  const historial = pedidos.filter(p => 
    ['completado', 'cancelado'].includes(p.estado) &&
    (p.cliente_id === usuario?.id || p.delivery_id === usuario?.id)
  ).sort((a, b) => 
    new Date(b.completado_at || b.cancelado_at || b.created_at).getTime() -
    new Date(a.completado_at || a.cancelado_at || a.created_at).getTime()
  );

  // Acciones
  const crearPedido = useCallback(async (nuevoPedido: NuevoPedido, cliente: Usuario): Promise<Pedido> => {
    setIsLoading(true);
    setError(null);

    try {
      const pedido = await crearPedidoCompleto(nuevoPedido, cliente);
      setPedidos(prev => [pedido, ...prev]);
      return pedido;
    } catch (err: any) {
      setError(err.message || 'Error al crear pedido');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const aceptarPedido = useCallback(async (
    pedidoId: string, 
    delivery: Usuario, 
    ubicacion: Coordenadas
  ): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const pedidoActualizado = await aceptarPedidoComoDelivery(pedidoId, delivery, ubicacion);
      setPedidos(prev => prev.map(p => p.id === pedidoId ? pedidoActualizado : p));
    } catch (err: any) {
      setError(err.message || 'Error al aceptar pedido');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const completarPedido = useCallback(async (pedidoId: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const pedido = pedidos.find(p => p.id === pedidoId);
      if (!pedido) throw new Error('Pedido no encontrado');

      const { pedido: pedidoActualizado } = await completarPedidoYProcesarPago(
        pedidoId, 
        pedido.metodo_pago
      );
      
      setPedidos(prev => prev.map(p => p.id === pedidoId ? pedidoActualizado : p));
    } catch (err: any) {
      setError(err.message || 'Error al completar pedido');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [pedidos]);

  const cancelarPedido = useCallback(async (pedidoId: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const pedidoActualizado = await pedidosService.cancelar(pedidoId);
      setPedidos(prev => prev.map(p => p.id === pedidoId ? pedidoActualizado : p));
    } catch (err: any) {
      setError(err.message || 'Error al cancelar pedido');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const marcarPagado = useCallback(async (pedidoId: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const pedidoActualizado = await pedidosService.marcarPagado(pedidoId);
      setPedidos(prev => prev.map(p => p.id === pedidoId ? pedidoActualizado : p));
    } catch (err: any) {
      setError(err.message || 'Error al marcar como pagado');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const verificarSiCalifique = useCallback(async (pedidoId: string): Promise<boolean> => {
    if (!usuario) return false;
    
    try {
      return await calificacionesService.verificarSiCalificoPedido(pedidoId, usuario.id);
    } catch (err) {
      console.error('Error al verificar calificación:', err);
      return false;
    }
  }, [usuario]);

  const crearCalificacion = useCallback(async (
    pedidoId: string, 
    calificadoId: string, 
    puntuacion: number, 
    comentario: string
  ): Promise<void> => {
    if (!usuario) throw new Error('Usuario no autenticado');

    setIsLoading(true);
    setError(null);

    try {
      await calificacionesService.crear({
        pedido_id: pedidoId,
        calificador_id: usuario.id,
        calificado_id: calificadoId,
        tipo_calificador: userMode || 'cliente',
        puntuacion,
        comentario: comentario || undefined
      });
    } catch (err: any) {
      setError(err.message || 'Error al crear calificación');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [usuario, userMode]);

  return {
    pedidos,
    pedidosDisponibles,
    misPedidos,
    misEntregas,
    historial,
    resumenFinanciero,
    isLoading,
    error,
    crearPedido,
    aceptarPedido,
    completarPedido,
    cancelarPedido,
    marcarPagado,
    refetch: cargarPedidos,
    verificarSiCalifique,
    crearCalificacion
  };
};

export default usePedidos;
