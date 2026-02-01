// ============================================================================
// USE GEOLOCATION HOOK - Hook para manejo de GPS
// ============================================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { LocationData } from '../types';
import { VILLEGAS_CENTER, GPS_OPTIONS, GPS_WATCH_OPTIONS } from '../utils/constants';

interface UseGeolocationReturn {
  location: LocationData | null;
  isLoading: boolean;
  error: string | null;
  isWatching: boolean;
  startWatching: () => void;
  stopWatching: () => void;
  getCurrentPosition: () => Promise<LocationData>;
}

export const useGeolocation = (autoWatch: boolean = false): UseGeolocationReturn => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isWatching, setIsWatching] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  // Función para obtener posición actual
  const getCurrentPosition = useCallback((): Promise<LocationData> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        // Fallback a General Villegas
        const fallbackLocation: LocationData = {
          lat: VILLEGAS_CENTER.lat,
          lng: VILLEGAS_CENTER.lng,
          accuracy: 100,
          timestamp: new Date(),
          isFallback: true
        };
        setLocation(fallbackLocation);
        resolve(fallbackLocation);
        return;
      }

      setIsLoading(true);
      setError(null);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationData: LocationData = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date(),
            isFallback: false
          };
          setLocation(locationData);
          setIsLoading(false);
          resolve(locationData);
        },
        (err) => {
          console.error('Error obteniendo GPS:', err.message);
          setError(err.message);
          setIsLoading(false);
          
          // Fallback a General Villegas
          const fallbackLocation: LocationData = {
            lat: VILLEGAS_CENTER.lat,
            lng: VILLEGAS_CENTER.lng,
            accuracy: 100,
            timestamp: new Date(),
            isFallback: true
          };
          setLocation(fallbackLocation);
          resolve(fallbackLocation);
        },
        GPS_OPTIONS
      );
    });
  }, []);

  // Iniciar seguimiento continuo
  const startWatching = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocalización no disponible');
      return;
    }

    if (watchIdRef.current !== null) {
      return; // Ya está vigilando
    }

    setIsWatching(true);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const locationData: LocationData = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date(),
          isFallback: false
        };
        setLocation(locationData);
        setError(null);
      },
      (err) => {
        console.error('Error en tracking GPS:', err.message);
        setError(err.message);
      },
      GPS_WATCH_OPTIONS
    );
  }, []);

  // Detener seguimiento
  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      setIsWatching(false);
    }
  }, []);

  // Auto-iniciar watching si se especifica
  useEffect(() => {
    if (autoWatch) {
      getCurrentPosition().then(() => {
        startWatching();
      });
    }

    return () => {
      stopWatching();
    };
  }, [autoWatch, getCurrentPosition, startWatching, stopWatching]);

  return {
    location,
    isLoading,
    error,
    isWatching,
    startWatching,
    stopWatching,
    getCurrentPosition
  };
};

export default useGeolocation;
