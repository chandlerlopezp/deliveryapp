// ============================================================================
// PEDIDOS DISPONIBLES COMPONENT - Lista de pedidos disponibles para delivery
// ============================================================================

import React from 'react';
import { Package, MapPin, Navigation, Route, Clock } from 'lucide-react';
import { Pedido } from '../../types';
import { MiniMapaPedido } from '../maps/MapaSelectorUbicacion';
import { Button } from '../common/Button';

interface PedidosDisponiblesProps {
  pedidos: Pedido[];
  onAceptar: (pedidoId: string) => void;
  isLoading?: boolean;
}

export const PedidosDisponibles: React.FC<PedidosDisponiblesProps> = ({
  pedidos,
  onAceptar,
  isLoading = false
}) => {
  if (pedidos.length === 0) {
    return (
      <div className="bg-white rounded-xl p-8 text-center shadow">
        <Package className="mx-auto mb-4 text-gray-400" size={64} />
        <p className="text-gray-600">No hay pedidos disponibles</p>
        <p className="text-sm text-gray-400 mt-2">Los nuevos pedidos aparecerán aquí</p>
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
              {/* Badge de método de pago */}
              <div className={`text-xs mt-1 px-2 py-0.5 rounded inline-block ${
                pedido.metodo_pago === 'tarjeta' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-green-100 text-green-700'
              }`}>
                {pedido.metodo_pago === 'tarjeta' ? '💳' : '💵'} {pedido.metodo_pago}
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
            <div className="flex gap-2">
              <Package className="text-gray-500 flex-shrink-0" size={18} />
              <div className="text-gray-600">{pedido.descripcion}</div>
            </div>
          </div>

          {/* Info de distancia y tiempo */}
          <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
            <span className="flex items-center gap-1">
              <Route size={16} />
              {pedido.distancia} km
            </span>
            <span className="flex items-center gap-1">
              <Clock size={16} />
              ~{pedido.tiempo_estimado} min
            </span>
          </div>

          {/* Botón aceptar */}
          <Button
            onClick={() => onAceptar(pedido.id)}
            isLoading={isLoading}
            variant="primary"
            fullWidth
            className="bg-purple-500 hover:bg-purple-600"
          >
            Aceptar pedido
          </Button>
        </div>
      ))}
    </div>
  );
};

export default PedidosDisponibles;
