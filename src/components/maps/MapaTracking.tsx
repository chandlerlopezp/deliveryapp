// ============================================================================
// MAPA TRACKING COMPONENT - Mapa con tracking del delivery en tiempo real
// ============================================================================

import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { Pedido, Coordenadas } from '../../types';
import { calcularDistancia } from '../../utils/helpers';

interface MapaTrackingProps {
  pedido: Pedido;
  deliveryLocation: Coordenadas;
  onClose: () => void;
}

export const MapaTracking: React.FC<MapaTrackingProps> = ({
  pedido,
  deliveryLocation,
  onClose
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const deliveryMarkerRef = useRef<any>(null);
  const polylineRef = useRef<any>(null);

  const distanciaRestante = calcularDistancia(deliveryLocation, pedido.coord_destino);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.L) return;
    if (!mapContainerRef.current || mapRef.current) return;

    const L = window.L;

    const centerLat = (deliveryLocation.lat + pedido.coord_destino.lat) / 2;
    const centerLng = (deliveryLocation.lng + pedido.coord_destino.lng) / 2;

    mapRef.current = L.map(mapContainerRef.current, {
      center: [centerLat, centerLng],
      zoom: 14,
      zoomControl: true,
      attributionControl: false
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(mapRef.current);

    // Ícono del delivery (moto animada)
    const deliveryIcon = L.divIcon({
      className: 'delivery-tracking-marker',
      html: `
        <div style="
          background: linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%);
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          animation: bounce 1s infinite;
        ">
          <span style="font-size: 20px;">🏍️</span>
        </div>
        <style>
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-5px); }
          }
        </style>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });

    // Ícono del destino
    const destinoIcon = L.divIcon({
      className: 'destino-marker',
      html: `
        <div style="
          background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <span style="color: white; font-size: 14px;">📍</span>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    // Marcador delivery
    deliveryMarkerRef.current = L.marker([deliveryLocation.lat, deliveryLocation.lng], { icon: deliveryIcon })
      .addTo(mapRef.current)
      .bindPopup('<strong style="color: #8B5CF6;">🏍️ Tu delivery</strong><br/><small>En camino...</small>');

    // Marcador destino
    L.marker([pedido.coord_destino.lat, pedido.coord_destino.lng], { icon: destinoIcon })
      .addTo(mapRef.current)
      .bindPopup(`<strong style="color: #EF4444;">📍 Destino</strong><br/><small>${pedido.destino}</small>`);

    // Polyline dinámica
    polylineRef.current = L.polyline(
      [
        [deliveryLocation.lat, deliveryLocation.lng],
        [pedido.coord_destino.lat, pedido.coord_destino.lng]
      ],
      {
        color: '#8B5CF6',
        weight: 4,
        opacity: 0.8,
        dashArray: '10, 10'
      }
    ).addTo(mapRef.current);

    // Ajustar vista
    const bounds = L.latLngBounds(
      [deliveryLocation.lat, deliveryLocation.lng],
      [pedido.coord_destino.lat, pedido.coord_destino.lng]
    );
    mapRef.current.fitBounds(bounds, { padding: [50, 50] });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Actualizar posición del delivery
  useEffect(() => {
    if (!mapRef.current || !deliveryMarkerRef.current || !polylineRef.current) return;

    const newLatLng = [deliveryLocation.lat, deliveryLocation.lng];
    deliveryMarkerRef.current.setLatLng(newLatLng);
    
    polylineRef.current.setLatLngs([
      newLatLng,
      [pedido.coord_destino.lat, pedido.coord_destino.lng]
    ]);
  }, [deliveryLocation, pedido.coord_destino]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl">
        <div className="bg-purple-600 text-white p-4 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-lg">🏍️ Tracking en vivo</h3>
            <p className="text-sm opacity-90">Pedido #{pedido.id}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg"
          >
            <X size={24} />
          </button>
        </div>
        
        <div ref={mapContainerRef} style={{ height: '350px' }} className="w-full" />
        
        <div className="p-4 bg-gray-50">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
              <span className="text-gray-600">Repartidor en camino</span>
            </div>
            <span className="text-purple-600 font-semibold">
              Distancia: {distanciaRestante.toFixed(1)} km
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-2">Actualización cada 10 segundos</p>
        </div>
      </div>
    </div>
  );
};

export default MapaTracking;
