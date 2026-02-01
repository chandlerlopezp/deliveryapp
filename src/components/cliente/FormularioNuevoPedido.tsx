// ============================================================================
// FORMULARIO NUEVO PEDIDO COMPONENT - Formulario para crear pedidos
// ============================================================================

import React, { useState, useCallback } from 'react';
import { MapPin, Loader, CheckCircle, Copy, CreditCard } from 'lucide-react';
import { NuevoPedido, Coordenadas } from '../../types';
import { geocodificarDireccion } from '../../services/geocoding';
import { calcularDistancia, calcularTiempoEstimado, copiarAlPortapapeles } from '../../utils/helpers';
import { Button } from '../common/Button';
import { MiniMapaPedido } from '../maps/MapaSelectorUbicacion';

interface FormularioNuevoPedidoProps {
  onSubmit: (pedido: NuevoPedido) => Promise<void>;
  onSuccess?: () => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

export const FormularioNuevoPedido: React.FC<FormularioNuevoPedidoProps> = ({
  onSubmit,
  onSuccess,
  showToast
}) => {
  const [nuevoPedido, setNuevoPedido] = useState<NuevoPedido>({
    origen: '',
    destino: '',
    descripcion: '',
    precio: '',
    metodoPago: 'efectivo',
    coordOrigen: null,
    coordDestino: null,
    displayOrigen: '',
    displayDestino: ''
  });
  const [isGeocodificando, setIsGeocodificando] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGeocodificar = useCallback(async () => {
    if (!nuevoPedido.origen || !nuevoPedido.destino) {
      showToast('Por favor ingresa origen y destino primero', 'warning');
      return;
    }

    setIsGeocodificando(true);

    try {
      const resultadoOrigen = await geocodificarDireccion(nuevoPedido.origen);
      
      if (!resultadoOrigen) {
        showToast('No se encontró la dirección de recogida', 'error');
        setIsGeocodificando(false);
        return;
      }
      
      // Rate limit de Nominatim
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      const resultadoDestino = await geocodificarDireccion(nuevoPedido.destino);
      
      if (!resultadoDestino) {
        showToast('No se encontró la dirección de entrega', 'error');
        setIsGeocodificando(false);
        return;
      }
      
      const dist = calcularDistancia(resultadoOrigen, resultadoDestino);
      const tiempo = calcularTiempoEstimado(dist);
      
      setNuevoPedido(prev => ({
        ...prev,
        coordOrigen: { lat: resultadoOrigen.lat, lng: resultadoOrigen.lng },
        coordDestino: { lat: resultadoDestino.lat, lng: resultadoDestino.lng },
        displayOrigen: resultadoOrigen.displayName,
        displayDestino: resultadoDestino.displayName
      }));
      
      showToast(`✅ Direcciones confirmadas! ${dist.toFixed(1)} km (~${tiempo} min)`, 'success');
      
    } catch (error) {
      showToast('Error al geocodificar. Intenta de nuevo.', 'error');
    }
    
    setIsGeocodificando(false);
  }, [nuevoPedido.origen, nuevoPedido.destino, showToast]);

  const handleSubmit = async () => {
    if (!nuevoPedido.origen || !nuevoPedido.destino || !nuevoPedido.descripcion || !nuevoPedido.precio) {
      showToast('Por favor completa todos los campos', 'warning');
      return;
    }

    if (!nuevoPedido.coordOrigen || !nuevoPedido.coordDestino) {
      showToast('Por favor verifica las direcciones con el botón "Geocodificar"', 'warning');
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(nuevoPedido);
      
      // Limpiar formulario
      setNuevoPedido({
        origen: '',
        destino: '',
        descripcion: '',
        precio: '',
        metodoPago: 'efectivo',
        coordOrigen: null,
        coordDestino: null,
        displayOrigen: '',
        displayDestino: ''
      });

      showToast('📦 Pedido creado exitosamente', 'success');
      onSuccess?.();
    } catch (error: any) {
      showToast(error.message || 'Error al crear pedido', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopiar = async (texto: string) => {
    const success = await copiarAlPortapapeles(texto);
    if (success) {
      showToast('📋 Dirección copiada', 'success');
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-md">
      <h2 className="text-2xl font-bold mb-6">Crear pedido</h2>
      
      <div className="space-y-4">
        {/* Origen */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Dirección de recogida
          </label>
          <input
            type="text"
            placeholder="Ej: Av. San Martin 1234"
            value={nuevoPedido.origen}
            onChange={(e) => setNuevoPedido({
              ...nuevoPedido, 
              origen: e.target.value, 
              coordOrigen: null, 
              displayOrigen: ''
            })}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {nuevoPedido.displayOrigen && (
            <button 
              onClick={() => handleCopiar(nuevoPedido.displayOrigen)}
              className="flex items-center gap-2 text-xs text-green-600 mt-1 ml-1 hover:text-green-700 cursor-pointer group"
            >
              <CheckCircle size={14} className="text-green-500" />
              <span className="flex-1 truncate">{nuevoPedido.displayOrigen}</span>
              <Copy size={12} className="opacity-0 group-hover:opacity-100" />
            </button>
          )}
        </div>

        {/* Destino */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Dirección de entrega
          </label>
          <input
            type="text"
            placeholder="Ej: Belgrano 567"
            value={nuevoPedido.destino}
            onChange={(e) => setNuevoPedido({
              ...nuevoPedido, 
              destino: e.target.value, 
              coordDestino: null, 
              displayDestino: ''
            })}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {nuevoPedido.displayDestino && (
            <button 
              onClick={() => handleCopiar(nuevoPedido.displayDestino)}
              className="flex items-center gap-2 text-xs text-green-600 mt-1 ml-1 hover:text-green-700 cursor-pointer group"
            >
              <CheckCircle size={14} className="text-green-500" />
              <span className="flex-1 truncate">{nuevoPedido.displayDestino}</span>
              <Copy size={12} className="opacity-0 group-hover:opacity-100" />
            </button>
          )}
        </div>

        {/* Botón geocodificar y preview */}
        <div className="border-t border-b py-4">
          <Button
            onClick={handleGeocodificar}
            disabled={isGeocodificando || !nuevoPedido.origen || !nuevoPedido.destino}
            isLoading={isGeocodificando}
            icon={<MapPin size={20} />}
            variant="primary"
            fullWidth
            className="bg-indigo-500 hover:bg-indigo-600"
          >
            {isGeocodificando ? 'Buscando direcciones...' : 'Geocodificar direcciones'}
          </Button>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Busca las direcciones en OpenStreetMap (General Villegas, Buenos Aires)
          </p>

          {/* Preview del mapa */}
          {nuevoPedido.coordOrigen && nuevoPedido.coordDestino && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">Vista previa de la ruta:</p>
              <MiniMapaPedido 
                pedido={{
                  id: 'preview',
                  origen: nuevoPedido.origen,
                  destino: nuevoPedido.destino,
                  coord_origen: nuevoPedido.coordOrigen,
                  coord_destino: nuevoPedido.coordDestino,
                  distancia: parseFloat(calcularDistancia(nuevoPedido.coordOrigen, nuevoPedido.coordDestino).toFixed(1))
                }} 
                height={180} 
              />
              <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                <CheckCircle size={16} />
                Direcciones verificadas correctamente
              </p>
            </div>
          )}
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descripción del pedido
          </label>
          <textarea
            placeholder="¿Qué necesitas enviar?"
            value={nuevoPedido.descripcion}
            onChange={(e) => setNuevoPedido({...nuevoPedido, descripcion: e.target.value})}
            className="w-full p-3 border rounded-lg h-24 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Precio */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Precio a pagar ($)
          </label>
          <input
            type="number"
            placeholder="500"
            value={nuevoPedido.precio}
            onChange={(e) => setNuevoPedido({...nuevoPedido, precio: e.target.value})}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Método de pago */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Método de pago
          </label>
          <select
            value={nuevoPedido.metodoPago}
            onChange={(e) => setNuevoPedido({...nuevoPedido, metodoPago: e.target.value as 'efectivo' | 'tarjeta'})}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="efectivo">💵 Efectivo</option>
            <option value="tarjeta">💳 Tarjeta (Mercado Pago)</option>
          </select>
          {nuevoPedido.metodoPago === 'tarjeta' && (
            <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
              <CreditCard size={12} />
              Pagarás con Mercado Pago al completar la entrega
            </p>
          )}
        </div>

        {/* Botón crear */}
        <Button
          onClick={handleSubmit}
          isLoading={isSubmitting}
          variant="primary"
          size="lg"
          fullWidth
        >
          Publicar pedido
        </Button>
      </div>
    </div>
  );
};

export default FormularioNuevoPedido;
