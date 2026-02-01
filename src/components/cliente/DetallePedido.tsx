// ============================================================================
// DETALLE PEDIDO / HISTORIAL COMPONENT - Historial de pedidos del cliente
// ============================================================================

import React from 'react';
import { History, MapPin, Navigation, Package, Route, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Pedido, ResumenFinanciero } from '../../types';
import { MiniMapaPedido } from '../maps/MapaSelectorUbicacion';
import { formatearFecha } from '../../utils/helpers';

interface DetallePedidoProps {
  historial: Pedido[];
  resumen: ResumenFinanciero;
  tipo: 'cliente' | 'delivery';
}

export const DetallePedido: React.FC<DetallePedidoProps> = ({
  historial,
  resumen,
  tipo
}) => {
  const gradientColor = tipo === 'cliente' 
    ? 'from-blue-500 to-blue-600' 
    : 'from-purple-500 to-purple-600';

  return (
    <div className="space-y-4">
      {/* Resumen */}
      <div className={`bg-gradient-to-r ${gradientColor} rounded-xl p-4 text-white shadow-md`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-90">
              {tipo === 'cliente' ? 'Total gastado en envíos' : 'Total ganado'}
            </p>
            <p className="text-3xl font-bold">
              ${(tipo === 'cliente' ? resumen.totalGastado : resumen.totalGanado).toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm opacity-90">
              {tipo === 'cliente' ? resumen.pedidosCompletados : resumen.entregasCompletadas}{' '}
              {tipo === 'cliente' ? 'pedidos' : 'entregas'}
            </p>
            {tipo === 'delivery' && (
              <p className="text-sm opacity-90">{resumen.distanciaTotal.toFixed(1)} km</p>
            )}
            <p className="text-sm opacity-90">completados</p>
          </div>
        </div>
      </div>

      {/* Lista de historial */}
      {historial.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center shadow">
          <History className="mx-auto mb-4 text-gray-400" size={64} />
          <p className="text-gray-600">
            No tienes {tipo === 'cliente' ? 'pedidos' : 'entregas'} en el historial
          </p>
        </div>
      ) : (
        historial.map(pedido => (
          <div key={pedido.id} className="bg-white rounded-xl p-6 shadow-md">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="font-semibold">Pedido #{pedido.id}</span>
                {pedido.estado === 'completado' && (
                  <div className="flex items-center gap-1 text-green-600 text-sm mt-1">
                    <CheckCircle size={14} />
                    <span>{tipo === 'cliente' ? 'Entregado' : 'Completado'}</span>
                  </div>
                )}
                {pedido.estado === 'cancelado' && (
                  <div className="flex items-center gap-1 text-red-600 text-sm mt-1">
                    <XCircle size={14} />
                    <span>Cancelado</span>
                  </div>
                )}
              </div>
              <div className={`text-2xl font-bold ${
                pedido.estado === 'completado' 
                  ? (tipo === 'delivery' ? 'text-green-600' : 'text-gray-800')
                  : 'text-gray-400 line-through'
              }`}>
                {tipo === 'delivery' && pedido.estado === 'completado' ? '+' : ''}
                ${pedido.precio}
              </div>
            </div>

            {/* Mini mapa */}
            <div className="mb-4">
              <MiniMapaPedido pedido={pedido} height={120} />
            </div>

            {/* Detalles */}
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex gap-2">
                <MapPin className="text-green-500 flex-shrink-0" size={16} />
                <div>{pedido.origen}</div>
              </div>
              <div className="flex gap-2">
                <Navigation className="text-red-500 flex-shrink-0" size={16} />
                <div>{pedido.destino}</div>
              </div>
              {tipo === 'cliente' && (
                <div className="flex gap-2">
                  <Package className="text-gray-500 flex-shrink-0" size={16} />
                  <div>{pedido.descripcion}</div>
                </div>
              )}
              <div className="flex items-center gap-4 mt-2 pt-2 border-t">
                <span className="flex items-center gap-1">
                  <Route size={14} />
                  {pedido.distancia} km
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={14} />
                  {pedido.completado_at 
                    ? formatearFecha(pedido.completado_at)
                    : pedido.cancelado_at 
                      ? formatearFecha(pedido.cancelado_at)
                      : '-'}
                </span>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default DetallePedido;
