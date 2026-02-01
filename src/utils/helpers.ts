// ============================================================================
// HELPERS - Funciones utilitarias
// ============================================================================

import { Coordenadas } from '../types';

/**
 * Calcula la distancia entre dos coordenadas usando la fórmula de Haversine
 * @returns Distancia en kilómetros
 */
export const calcularDistancia = (coord1: Coordenadas, coord2: Coordenadas): number => {
  const R = 6371; // Radio de la Tierra en km
  const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
  const dLon = (coord2.lng - coord1.lng) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Calcula el tiempo estimado basado en la distancia
 * @returns Tiempo en minutos
 */
export const calcularTiempoEstimado = (distanciaKm: number): number => {
  return Math.round(distanciaKm * 5) + 5; // ~12 km/h promedio + 5 min buffer
};

/**
 * Formatea un número como precio en pesos argentinos
 */
export const formatearPrecio = (precio: number): string => {
  return `$${precio.toLocaleString('es-AR')}`;
};

/**
 * Formatea una fecha a string legible
 */
export const formatearFecha = (fecha: string | Date): string => {
  const date = typeof fecha === 'string' ? new Date(fecha) : fecha;
  return date.toLocaleDateString('es-AR');
};

/**
 * Formatea una hora a string legible
 */
export const formatearHora = (fecha: string | Date): string => {
  const date = typeof fecha === 'string' ? new Date(fecha) : fecha;
  return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
};

/**
 * Obtiene la inicial de un nombre
 */
export const getInicial = (nombre: string): string => {
  return nombre ? nombre.charAt(0).toUpperCase() : '?';
};

/**
 * Genera un ID único
 */
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

/**
 * Trunca un texto a cierta longitud
 */
export const truncarTexto = (texto: string, maxLength: number): string => {
  if (texto.length <= maxLength) return texto;
  return texto.substring(0, maxLength) + '...';
};

/**
 * Valida un email
 */
export const validarEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

/**
 * Valida un teléfono argentino
 */
export const validarTelefono = (telefono: string): boolean => {
  const re = /^[\d\s\-\+\(\)]{8,15}$/;
  return re.test(telefono);
};

/**
 * Debounce function
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Copia texto al portapapeles
 */
export const copiarAlPortapapeles = async (texto: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch (error) {
    console.error('Error al copiar:', error);
    return false;
  }
};

/**
 * Parsea coordenadas desde formato de base de datos
 */
export const parseCoordenadas = (
  lat: number,
  lng: number
): Coordenadas => {
  return { lat, lng };
};

/**
 * Convierte pedido de formato DB a formato app
 */
export const pedidoFromDB = (dbPedido: any): any => {
  return {
    ...dbPedido,
    coord_origen: {
      lat: dbPedido.coord_origen_lat,
      lng: dbPedido.coord_origen_lng
    },
    coord_destino: {
      lat: dbPedido.coord_destino_lat,
      lng: dbPedido.coord_destino_lng
    }
  };
};

/**
 * Convierte pedido de formato app a formato DB
 */
export const pedidoToDB = (pedido: any): any => {
  const { coord_origen, coord_destino, ...rest } = pedido;
  return {
    ...rest,
    coord_origen_lat: coord_origen.lat,
    coord_origen_lng: coord_origen.lng,
    coord_destino_lat: coord_destino.lat,
    coord_destino_lng: coord_destino.lng
  };
};
