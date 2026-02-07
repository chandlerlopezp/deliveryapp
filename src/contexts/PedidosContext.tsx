// ============================================================================
// PEDIDOS CONTEXT - Contexto de pedidos
// ============================================================================

import React, { createContext, useContext, ReactNode, useState } from 'react';
import { usePedidos } from '../hooks/usePedidos';
import { useAuthContext } from './AuthContext';
import { Pedido, Usuario, NuevoPedido, Coordenadas, ResumenFinanciero } from '../types';

interface PedidosContextType {
  pedidos: Pedido[];
  pedidosDisponibles: Pedido[];
  misPedidos: Pedido[];
  misEntregas: Pedido[];
  historial: Pedido[];
  resumenFinanciero: ResumenFinanciero;
  isLoading: boolean;
  error: string | null;
  selectedPedido: Pedido | null;
  setSelectedPedido: (pedido: Pedido | null) => void;
  crearPedido: (nuevoPedido: NuevoPedido, cliente: Usuario) => Promise<Pedido>;
  aceptarPedido: (pedidoId: string, delivery: Usuario, ubicacion: Coordenadas) => Promise<void>;
  completarPedido: (pedidoId: string) => Promise<void>;
  cancelarPedido: (pedidoId: string) => Promise<void>;
  marcarPagado: (pedidoId: string) => Promise<void>;
  refetch: () => Promise<void>;
  verificarSiCalifique: (pedidoId: string) => Promise<boolean>;
  crearCalificacion: (pedidoId: string, calificadoId: string, puntuacion: number, comentario: string) => Promise<void>;
}

const PedidosContext = createContext<PedidosContextType | undefined>(undefined);

interface PedidosProviderProps {
  children: ReactNode;
}

export const PedidosProvider: React.FC<PedidosProviderProps> = ({ children }) => {
  const { profile, userMode } = useAuthContext();
  const pedidosHook = usePedidos(profile, userMode);
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null);

  const value: PedidosContextType = {
    ...pedidosHook,
    selectedPedido,
    setSelectedPedido
  };

  return (
    <PedidosContext.Provider value={value}>
      {children}
    </PedidosContext.Provider>
  );
};

export const usePedidosContext = (): PedidosContextType => {
  const context = useContext(PedidosContext);
  if (context === undefined) {
    throw new Error('usePedidosContext debe usarse dentro de un PedidosProvider');
  }
  return context;
};

export default PedidosContext;
