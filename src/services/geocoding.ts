// ============================================================================
// GEOCODING SERVICE - Nominatim OpenStreetMap
// ============================================================================

import { GeocodingResult } from '../types';

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
const USER_AGENT = 'DeliverYA-App/1.0 (santiagolopezpinedo@gmail.com)';

/**
 * Geocodifica una dirección usando Nominatim (OpenStreetMap)
 * @param direccion Dirección a geocodificar
 * @param contexto Contexto adicional (ciudad, provincia, país)
 * @returns Coordenadas y nombre completo de la dirección
 */
export const geocodificarDireccion = async (
  direccion: string,
  contexto: string = 'General Villegas, Buenos Aires, Argentina'
): Promise<GeocodingResult | null> => {
  try {
    // Agregar contexto si no está incluido
    const direccionLower = direccion.toLowerCase();
    const tieneContexto = 
      direccionLower.includes('villegas') || 
      direccionLower.includes('buenos aires') ||
      direccionLower.includes('argentina');
    
    const direccionCompleta = tieneContexto 
      ? direccion 
      : `${direccion}, ${contexto}`;
    
    const query = encodeURIComponent(direccionCompleta);
    const url = `${NOMINATIM_BASE_URL}/search?format=json&q=${query}&countrycodes=ar&addressdetails=1&limit=1`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': USER_AGENT
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error de red: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data && data.length > 0) {
      const resultado = data[0];
      return {
        lat: parseFloat(resultado.lat),
        lng: parseFloat(resultado.lon),
        displayName: resultado.display_name
      };
    }
    
    return null;
    
  } catch (error) {
    console.error('Error en geocodificación:', error);
    throw error;
  }
};

/**
 * Geocodificación inversa: coordenadas a dirección
 * @param lat Latitud
 * @param lng Longitud
 * @returns Dirección legible
 */
export const geocodificacionInversa = async (
  lat: number,
  lng: number
): Promise<string | null> => {
  try {
    const url = `${NOMINATIM_BASE_URL}/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': USER_AGENT
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error de red: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data && data.display_name) {
      return data.display_name;
    }
    
    return null;
    
  } catch (error) {
    console.error('Error en geocodificación inversa:', error);
    throw error;
  }
};

/**
 * Buscar lugares cercanos
 * @param lat Latitud
 * @param lng Longitud
 * @param query Término de búsqueda
 * @returns Lista de lugares
 */
export const buscarLugaresCercanos = async (
  lat: number,
  lng: number,
  query: string
): Promise<GeocodingResult[]> => {
  try {
    const url = `${NOMINATIM_BASE_URL}/search?format=json&q=${encodeURIComponent(query)}&lat=${lat}&lon=${lng}&limit=5&bounded=1&viewbox=${lng-0.1},${lat+0.1},${lng+0.1},${lat-0.1}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': USER_AGENT
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error de red: ${response.status}`);
    }
    
    const data = await response.json();
    
    return (data || []).map((item: any) => ({
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      displayName: item.display_name
    }));
    
  } catch (error) {
    console.error('Error buscando lugares cercanos:', error);
    throw error;
  }
};

export default {
  geocodificarDireccion,
  geocodificacionInversa,
  buscarLugaresCercanos
};
