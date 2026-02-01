// ============================================================================
// AUTH CONTEXT - Contexto de autenticación
// ============================================================================

import React, { createContext, useContext, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { useAuth } from '../hooks/useAuth';
import { Usuario, LoginData, UserMode } from '../types';

interface AuthContextType {
  user: User | null;
  profile: Usuario | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  userMode: UserMode;
  setUserMode: (mode: UserMode) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (data: LoginData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<Usuario>) => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const auth = useAuth();
  const [userMode, setUserMode] = React.useState<UserMode>(null);

  // Cargar modo guardado
  React.useEffect(() => {
    const savedMode = localStorage.getItem('deliveryAppMode') as UserMode;
    if (savedMode) {
      setUserMode(savedMode);
    }
  }, []);

  // Guardar modo cuando cambie
  const handleSetUserMode = React.useCallback((mode: UserMode) => {
    setUserMode(mode);
    if (mode) {
      localStorage.setItem('deliveryAppMode', mode);
    } else {
      localStorage.removeItem('deliveryAppMode');
    }
  }, []);

  // Limpiar modo al cerrar sesión
  const handleLogout = React.useCallback(async () => {
    await auth.logout();
    setUserMode(null);
    localStorage.removeItem('deliveryAppMode');
  }, [auth]);

  const value: AuthContextType = {
    ...auth,
    userMode,
    setUserMode: handleSetUserMode,
    logout: handleLogout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext debe usarse dentro de un AuthProvider');
  }
  return context;
};

export default AuthContext;
