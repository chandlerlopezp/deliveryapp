// ============================================================================
// PEDIDOS ACTIVOS COMPONENT - Lista de entregas activas del delivery
// ============================================================================

import React, { useState } from 'react';
import { Bike, MapPin, Navigation, MessageCircle, CheckCircle } from 'lucide-react';
import { Pedido, Usuario } from '../../types';
import { MiniMapaPedido } from '../maps/MapaSelectorUbicacion';
import { Button } from '../common/Button';
import { CalificacionModal } from '../CalificacionModal';

interface PedidosActivosProps {
  pedidos: Pedido[];
  unreadMessages: Record<string, number>;
  usuarioActual: Usuario;
  onAbrirChat: (pedido: Pedido) => void;
  onCompletar: (pedidoId: string) => void;
  onCalificar: (pedidoId: string, calificadoId: string, puntuacion: number, comentario: string) => Promise<void>;
  isLoading?: boolean;
}

export const PedidosActivos: React.FC<PedidosActivosProps> = ({
  pedidos,
  unreadMessages,
  usuarioActual,
  onAbrirChat,
  onCompletar,
  onCalificar,
  isLoading = false
}) => {
  const [pedidoACalificar, setPedidoACalificar] = useState<Pedido | null>(null);
  const [isCompletando, setIsCompletando] = useState(false);

  const handleCompletar = async (pedidoId: string) => {
    setIsCompletando(true);
    try {
      console.log('🔍 Completando pedido:', pedidoId);
      await onCompletar(pedidoId);
      
      // Después de completar, mostrar modal de calificación
      const pedido = pedidos.find(p => p.id === pedidoId);
      console.log('🔍 Pedido encontrado:', pedido);
      
      if (pedido) {
        console.log('✅ Mostrando modal de calificación');
        setPedidoACalificar(pedido);
      } else {
        console.log('❌ No se encontró el pedido');
      }
    } catch (error) {
      console.error('❌ Error al completar:', error);
    } finally {
      setIsCompletando(false);
    }
  };

  const handleCalificar = async (puntuacion: number, comentario: string) => {
    if (!pedidoACalificar) return;
    
    await onCalificar(
      pedidoACalificar.id,
      pedidoACalificar.cliente_id,
      puntuacion,
      comentario
    );
    
    setPedidoACalificar(null);
  };

  if (pedidos.length === 0) {
    return (
      <div className="bg-white rounded-xl p-8 text-center shadow">
        <Bike className="mx-auto mb-4 text-gray-400" size={64} />
        <p className="text-gray-600">No has aceptado pedidos</p>
        <p className="text-sm text-gray-400 mt-2">Acepta pedidos de la lista de disponibles</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {pedidos.map(pedido => (
          <div key={pedido.id} className="bg-white rounded-xl p-6 shadow-md">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="font-semibold">Pedido #{pedido.id.slice(0, 8)}</span>
                <div className="flex items-center gap-1 text-purple-600 text-sm mt-1">
                  <Bike size={14} className="animate-pulse" />
                  <span>En camino</span>
                </div>
              </div>
              <div className="text-2xl font-bold text-green-600">${pedido.precio}</div>
            </div>

            {/* Mini mapa */}
            <div className="mb-4">
              <MiniMapaPedido pedido={pedido} height={150} />
            </div>

            {/* Detalles */}
            <div className="space-y-2 mb-4 text-sm">
              <div className="flex gap-2">
                <MapPin className="text-green-500 flex-shrink-0" size={18} />
                <div>{pedido.origen}</div>
              </div>
              <div className="flex gap-2">
                <Navigation className="text-red-500 flex-shrink-0" size={18} />
                <div>{pedido.destino}</div>
              </div>
            </div>

            {/* Info del cliente */}
            {pedido.cliente_nombre && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm">
                <span className="text-gray-500">Cliente: </span>
                <span className="font-medium">{pedido.cliente_nombre}</span>
              </div>
            )}

            {/* Acciones */}
            <div className="flex gap-2">
              <button
                onClick={() => onAbrirChat(pedido)}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg flex items-center justify-center gap-2 transition-colors relative"
              >
                <MessageCircle size={18} />
                Chat
                {unreadMessages[pedido.id] > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                    {unreadMessages[pedido.id]}
                  </span>
                )}
              </button>
              <Button
                onClick={() => handleCompletar(pedido.id)}
                isLoading={isCompletando || isLoading}
                variant="success"
                icon={<CheckCircle size={18} />}
                className="flex-1"
              >
                Completar
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de calificación */}
      {pedidoACalificar && (
        <CalificacionModal
          pedido={pedidoACalificar}
          usuarioActual={usuarioActual}
          usuarioACalificar={{
            id: pedidoACalificar.cliente_id,
            nombre: pedidoACalificar.cliente_nombre || 'Cliente',
            role: 'cliente'
          }}
          onClose={() => setPedidoACalificar(null)}
          onCalificar={handleCalificar}
        />
      )}
    </>
  );
};

export default PedidosActivos;