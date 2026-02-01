// ============================================================================
// MAPA UBICACION COMPONENT - Mapa principal con ubicación del delivery
// ============================================================================

import React, { useEffect, useRef } from 'react';
import { Loader, Navigation, Crosshair } from 'lucide-react';
import { LocationData } from '../../types';
import { VILLEGAS_CENTER } from '../../utils/constants';

declare global {
  interface Window {
    L: any;
  }
}

interface MapaUbicacionProps {
  currentLocation: LocationData | null;
  isLoading?: boolean;
  height?: string;
  showAccuracy?: boolean;
  showCenterButton?: boolean;
}

export const MapaUbicacion: React.FC<MapaUbicacionProps> = ({
  currentLocation,
  isLoading = false,
  height = '280px',
  showAccuracy = true,
  showCenterButton = true
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const accuracyCircleRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.L) {
      console.warn('Leaflet no está cargado');
      return;
    }

    if (!mapContainerRef.current || mapRef.current) return;

    const L = window.L;

    const center = currentLocation 
      ? [currentLocation.lat, currentLocation.lng] 
      : [VILLEGAS_CENTER.lat, VILLEGAS_CENTER.lng];

    mapRef.current = L.map(mapContainerRef.current, {
      center,
      zoom: 15,
      zoomControl: true,
      attributionControl: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19
    }).addTo(mapRef.current);

    const deliveryIcon = L.divIcon({
      className: 'custom-delivery-marker',
      html: `
        <div style="
          background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%);
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          animation: pulse 2s infinite;
        ">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
            <circle cx="12" cy="12" r="3"/>
          </svg>
        </div>
        <style>
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
          }
        </style>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });

    markerRef.current = L.marker(center, { icon: deliveryIcon })
      .addTo(mapRef.current)
      .bindPopup('<strong style="color: #3B82F6;">📍 Tu ubicación</strong>');

    if (currentLocation?.accuracy) {
      accuracyCircleRef.current = L.circle(center, {
        radius: currentLocation.accuracy,
        color: '#3B82F6',
        fillColor: '#3B82F6',
        fillOpacity: 0.1,
        weight: 2,
        dashArray: '5, 5'
      }).addTo(mapRef.current);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !markerRef.current || !currentLocation) return;

    const newLatLng = [currentLocation.lat, currentLocation.lng];
    markerRef.current.setLatLng(newLatLng);

    if (accuracyCircleRef.current) {
      accuracyCircleRef.current.setLatLng(newLatLng);
      accuracyCircleRef.current.setRadius(currentLocation.accuracy || 50);
    }

    mapRef.current.setView(newLatLng, mapRef.current.getZoom(), { animate: true });
  }, [currentLocation]);

  const handleCenterMap = () => {
    if (mapRef.current && currentLocation) {
      mapRef.current.setView([currentLocation.lat, currentLocation.lng], 16, { animate: true });
    }
  };

  return (
    <div className="relative w-full rounded-xl overflow-hidden shadow-lg">
      <div ref={mapContainerRef} className="w-full bg-gray-100" style={{ minHeight: height }} />
      
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center z-10">
          <div className="text-center">
            <Loader className="animate-spin mx-auto mb-2 text-blue-500" size={32} />
            <p className="text-sm text-gray-600">Obteniendo ubicación GPS...</p>
          </div>
        </div>
      )}

      {showAccuracy && currentLocation?.accuracy && (
        <div className="absolute bottom-3 left-3 bg-white bg-opacity-95 px-3 py-2 rounded-lg shadow-md text-xs z-10">
          <div className="flex items-center gap-2">
            <Crosshair size={14} className="text-blue-500" />
            <span className="text-gray-700">Precisión: ±{Math.round(currentLocation.accuracy)}m</span>
          </div>
        </div>
      )}

      {showCenterButton && (
        <button
          onClick={handleCenterMap}
          className="absolute bottom-3 right-3 bg-white p-2 rounded-lg shadow-md hover:bg-gray-50 transition-colors z-10"
          title="Centrar en mi ubicación"
        >
          <Navigation size={20} className="text-blue-600" />
        </button>
      )}
    </div>
  );
};

export default MapaUbicacion;
