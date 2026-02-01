// ============================================================================
// MAPA SELECTOR UBICACION - Mini mapa para mostrar origen y destino
// ============================================================================

import React, { useEffect, useRef } from 'react';
import { Pedido, Coordenadas } from '../../types';

interface MapaSelectorUbicacionProps {
  coordOrigen: Coordenadas;
  coordDestino: Coordenadas;
  origen?: string;
  destino?: string;
  distancia?: number;
  height?: number;
}

export const MapaSelectorUbicacion: React.FC<MapaSelectorUbicacionProps> = ({
  coordOrigen,
  coordDestino,
  origen,
  destino,
  distancia,
  height = 150
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const mapIdRef = useRef(`minimap-${Date.now()}`);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.L) {
      console.warn('Leaflet no está cargado');
      return;
    }

    if (!mapContainerRef.current || mapRef.current) return;

    const L = window.L;

    const centerLat = (coordOrigen.lat + coordDestino.lat) / 2;
    const centerLng = (coordOrigen.lng + coordDestino.lng) / 2;

    mapRef.current = L.map(mapContainerRef.current, {
      center: [centerLat, centerLng],
      zoom: 14,
      zoomControl: false,
      attributionControl: false,
      dragging: true,
      scrollWheelZoom: false
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(mapRef.current);

    // Ícono de origen (verde)
    const origenIcon = L.divIcon({
      className: 'custom-origen-marker',
      html: `
        <div style="
          background: linear-gradient(135deg, #10B981 0%, #059669 100%);
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 2px 8px rgba(16, 185, 129, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <span style="color: white; font-size: 12px; font-weight: bold;">A</span>
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });

    // Ícono de destino (rojo)
    const destinoIcon = L.divIcon({
      className: 'custom-destino-marker',
      html: `
        <div style="
          background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <span style="color: white; font-size: 12px; font-weight: bold;">B</span>
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });

    // Marcadores
    L.marker([coordOrigen.lat, coordOrigen.lng], { icon: origenIcon })
      .addTo(mapRef.current)
      .bindPopup(`<strong style="color: #10B981;">🟢 Recoger</strong><br/><small>${origen || 'Origen'}</small>`);

    L.marker([coordDestino.lat, coordDestino.lng], { icon: destinoIcon })
      .addTo(mapRef.current)
      .bindPopup(`<strong style="color: #EF4444;">🔴 Entregar</strong><br/><small>${destino || 'Destino'}</small>`);

    // Polyline
    L.polyline(
      [
        [coordOrigen.lat, coordOrigen.lng],
        [coordDestino.lat, coordDestino.lng]
      ],
      {
        color: '#6366F1',
        weight: 3,
        opacity: 0.7,
        dashArray: '10, 10',
        lineCap: 'round'
      }
    ).addTo(mapRef.current);

    // Ajustar vista
    const bounds = L.latLngBounds(
      [coordOrigen.lat, coordOrigen.lng],
      [coordDestino.lat, coordDestino.lng]
    );
    mapRef.current.fitBounds(bounds, { padding: [30, 30] });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [coordOrigen, coordDestino]);

  return (
    <div className="relative w-full rounded-lg overflow-hidden border border-gray-200">
      <div 
        ref={mapContainerRef}
        className="w-full bg-gray-100"
        style={{ height: `${height}px` }}
      />
      
      {/* Leyenda */}
      <div className="absolute bottom-2 left-2 bg-white bg-opacity-95 px-2 py-1 rounded text-xs flex items-center gap-3 z-10">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-500"></span>
          Recoger
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-500"></span>
          Entregar
        </span>
      </div>
      
      {/* Distancia */}
      {distancia && (
        <div className="absolute top-2 right-2 bg-indigo-500 text-white px-2 py-1 rounded text-xs font-semibold z-10">
          {distancia} km
        </div>
      )}
    </div>
  );
};

// Wrapper para usar con Pedido
interface MiniMapaPedidoProps {
  pedido: Pedido | { 
    id: string; 
    origen: string; 
    destino: string; 
    coord_origen: Coordenadas; 
    coord_destino: Coordenadas; 
    distancia?: number 
  };
  height?: number;
}

export const MiniMapaPedido: React.FC<MiniMapaPedidoProps> = ({ pedido, height = 150 }) => {
  return (
    <MapaSelectorUbicacion
      coordOrigen={pedido.coord_origen}
      coordDestino={pedido.coord_destino}
      origen={pedido.origen}
      destino={pedido.destino}
      distancia={pedido.distancia}
      height={height}
    />
  );
};

export default MapaSelectorUbicacion;
