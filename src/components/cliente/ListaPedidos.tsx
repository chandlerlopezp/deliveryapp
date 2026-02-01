// ============================================================================
// LISTA PEDIDOS COMPONENT - Lista de pedidos del cliente
// ============================================================================

import React from 'react';
import { Package, MapPin, Navigation, Clock, Bike, Eye, MessageCircle, XCircle } from 'lucide-react';
import { Pedido } from '../../types';
import { MiniMapaPedido } from '../maps/MapaSelectorUbicacion';
import { Button } from '../common/Button';

interface ListaPedidosProps {
  pedidos: Pedido[];
  unreadMessages: Record<string, number>;
  onVerTracking: (pedido: Pedido) => void;
  onAbrirChat: (pedido: Pedido) => void;
  onCancelar: (pedidoId: string) => void;
  onCrearPedido: () => void;
}

export const ListaPedidos: React.FC<ListaPedidosProps> = ({
  pedidos,
  unreadMessages,
  onVerTracking,
  onAbrirChat,
  onCancelar,
  onCrearPedido
}) => {
  if (pedidos.length === 0) {
    return (
      <div className="bg-white rounded-xl p-8 text-center shadow">
        <Package className="mx-auto mb-4 text-gray-400" size={64} />
        <p className="text-gray-600">No has creado pedidos</p>
        <button
          onClick={onCrearPedido}
          className="mt-4 text-blue-600 hover:text-blue-700 font-semibold"
        >
          Crear tu primer pedido
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {pedidos.map(pedido => (
        <div key={pedido.id} className="bg-white rounded-xl p-6 shadow-md">
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className="font-semibold">Pedido #{pedido.id}</span>
              
              {/* Estado del pedido */}
              {pedido.estado === 'pendiente' && (
                <div className="flex items-center gap-2 text-orange-600 bg-orange-50 px-3 py-1 rounded-full mt-2 w-fit">
                  <Clock size={16} />
                  <span className="text-sm font-semibold">Buscando delivery...</span>
                </div>
              )}
              {(pedido.estado === 'en-camino') && (
                <div className="flex items-center gap-2 text-purple-600 bg-purple-50 px-3 py-1 rounded-full mt-2 w-fit">
                  <Bike size={16} className="animate-pulse" />
                  <span className="text-sm font-semibold">En camino</span>
                </div>
              )}
            </div>
            
            <div className="text-right">
              <div className="text-2xl font-bold">${pedido.precio}</div>
              <div className={`text-xs mt-1 ${pedido.metodo_pago === 'tarjeta' ? 'text-blue-600' : 'text-green-600'}`}>
                {pedido.metodo_pago === 'tarjeta' ? '💳 Tarjeta' : '💵 Efectivo'}
              </div>
            </div>
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
            <div className="flex gap-2">
              <Package className="text-gray-500 flex-shrink-0" size={18} />
              <div className="text-gray-600">{pedido.descripcion}</div>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex gap-2">
            {pedido.estado === 'en-camino' && (
              <>
                <Button
                  onClick={() => onVerTracking(pedido)}
                  variant="primary"
                  icon={<Eye size={18} />}
                  className="flex-1 bg-purple-500 hover:bg-purple-600"
                >
                  Ver tracking
                </Button>
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
              </>
            )}
            {pedido.estado === 'pendiente' && (
              <Button
                onClick={() => onCancelar(pedido.id)}
                variant="danger"
                icon={<XCircle size={18} />}
                fullWidth
              >
                Cancelar pedido
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ListaPedidos;
