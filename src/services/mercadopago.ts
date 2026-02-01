// ============================================================================
// MERCADO PAGO SERVICE - Integración con Mercado Pago Checkout Pro
// ============================================================================

import { MP_PUBLIC_KEY } from '../utils/constants';
import { Pedido } from '../types';

// Tipo para la instancia de Mercado Pago
declare global {
  interface Window {
    MercadoPago: any;
  }
}

let mpInstance: any = null;

/**
 * Inicializa el SDK de Mercado Pago
 */
export const inicializarMercadoPago = (): any => {
  if (typeof window !== 'undefined' && window.MercadoPago) {
    try {
      mpInstance = new window.MercadoPago(MP_PUBLIC_KEY, { locale: 'es-AR' });
      console.log('Mercado Pago SDK inicializado');
      return mpInstance;
    } catch (error) {
      console.error('Error inicializando Mercado Pago:', error);
      throw error;
    }
  }
  return null;
};

/**
 * Obtiene la instancia de Mercado Pago
 */
export const getMpInstance = (): any => {
  if (!mpInstance) {
    return inicializarMercadoPago();
  }
  return mpInstance;
};

/**
 * Crea una preferencia de pago
 * NOTA: En producción, esto debe hacerse desde el backend con Access Token
 */
export const crearPreferenciaPago = async (pedido: Pedido): Promise<string> => {
  // Simulación para modo de desarrollo
  // En producción, llamar a tu backend que use el Access Token de MP
  const simulatedPreferenceId = `TEST-${Date.now()}-${pedido.id}`;
  
  console.log('Preferencia creada (simulada):', simulatedPreferenceId);
  console.log('Pedido:', {
    id: pedido.id,
    descripcion: pedido.descripcion,
    precio: pedido.precio
  });
  
  // En producción, harías algo como:
  // const response = await fetch('/api/crear-preferencia', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({
  //     items: [{
  //       title: `Envío #${pedido.id}`,
  //       description: pedido.descripcion,
  //       quantity: 1,
  //       currency_id: 'ARS',
  //       unit_price: pedido.precio
  //     }],
  //     back_urls: {
  //       success: `${window.location.origin}/pago/exito`,
  //       failure: `${window.location.origin}/pago/fallo`,
  //       pending: `${window.location.origin}/pago/pendiente`
  //     },
  //     auto_return: 'approved',
  //     external_reference: pedido.id
  //   })
  // });
  // const data = await response.json();
  // return data.id;
  
  return simulatedPreferenceId;
};

/**
 * Renderiza el botón de Wallet de Mercado Pago
 */
export const renderizarWallet = async (
  containerId: string,
  preferenceId: string,
  onReady?: () => void,
  onError?: (error: any) => void
): Promise<void> => {
  const mp = getMpInstance();
  
  if (!mp) {
    throw new Error('Mercado Pago SDK no está inicializado');
  }
  
  try {
    const bricksBuilder = mp.bricks();
    
    await bricksBuilder.create('wallet', containerId, {
      initialization: {
        preferenceId: preferenceId
      },
      callbacks: {
        onReady: () => {
          console.log('Wallet listo');
          onReady?.();
        },
        onError: (error: any) => {
          console.error('Error en Wallet:', error);
          onError?.(error);
        }
      }
    });
  } catch (error) {
    console.error('Error renderizando Wallet:', error);
    throw error;
  }
};

/**
 * Simula un flujo de pago para demo
 * NOTA: Solo para desarrollo, en producción el flujo es real
 */
export const simularPago = async (
  pedidoId: string,
  onProgress?: (step: string) => void
): Promise<{ success: boolean; transactionId?: string }> => {
  return new Promise((resolve) => {
    // Simular proceso de pago
    setTimeout(() => {
      onProgress?.('Procesando pago...');
    }, 500);
    
    setTimeout(() => {
      onProgress?.('Verificando tarjeta...');
    }, 1500);
    
    setTimeout(() => {
      onProgress?.('Confirmando transacción...');
    }, 2500);
    
    setTimeout(() => {
      const transactionId = `TRX-${Date.now()}-${pedidoId}`;
      resolve({
        success: true,
        transactionId
      });
    }, 3500);
  });
};

/**
 * Verifica el estado de un pago
 * NOTA: En producción, esto debe hacerse desde el backend
 */
export const verificarEstadoPago = async (
  paymentId: string
): Promise<{ status: string; detail: string }> => {
  // Simulación para desarrollo
  console.log('Verificando pago:', paymentId);
  
  // En producción:
  // const response = await fetch(`/api/verificar-pago/${paymentId}`);
  // return response.json();
  
  return {
    status: 'approved',
    detail: 'Pago aprobado'
  };
};

/**
 * Datos de tarjeta de prueba para Mercado Pago
 */
export const TARJETA_PRUEBA = {
  numero: '4509 9535 6623 3704',
  vencimiento: '11/25',
  cvv: '123',
  nombre: 'APRO'
};

export default {
  inicializarMercadoPago,
  getMpInstance,
  crearPreferenciaPago,
  renderizarWallet,
  simularPago,
  verificarEstadoPago,
  TARJETA_PRUEBA
};
