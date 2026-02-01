// ============================================================================
// USE AUTH HOOK - Hook de autenticación con Supabase
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { authService } from '../services/supabase';
import { Usuario, LoginData } from '../types';

interface UseAuthReturn {
  user: User | null;
  profile: Usuario | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: LoginData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<Usuario>) => Promise<void>;
  error: string | null;
  clearError: () => void;
}

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar usuario actual al montar
  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);

        if (currentUser) {
          const userProfile = await authService.getProfile(currentUser.id);
          setProfile(userProfile);
        }
      } catch (err) {
        console.error('Error loading user:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();

    // Suscribirse a cambios de auth
    const { data: { subscription } } = authService.onAuthStateChange(async (user) => {
      setUser(user);
      if (user) {
        const userProfile = await authService.getProfile(user.id);
        setProfile(userProfile);
      } else {
        setProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { user } = await authService.signIn(email, password);
      setUser(user);

      if (user) {
        const userProfile = await authService.getProfile(user.id);
        setProfile(userProfile);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Error al iniciar sesión';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (data: LoginData) => {
    setIsLoading(true);
    setError(null);

    try {
      // Validaciones
      if (!data.nombre || !data.email || !data.telefono || !data.password) {
        throw new Error('Todos los campos son requeridos');
      }

      if (data.password.length < 6) {
        throw new Error('La contraseña debe tener al menos 6 caracteres');
      }

      const { user } = await authService.signUp(data.email, data.password, {
        nombre: data.nombre,
        telefono: data.telefono
      });

      setUser(user);

      if (user) {
        const userProfile = await authService.getProfile(user.id);
        setProfile(userProfile);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Error al registrarse';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await authService.signOut();
      setUser(null);
      setProfile(null);
    } catch (err: any) {
      const errorMessage = err.message || 'Error al cerrar sesión';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (updates: Partial<Usuario>) => {
    if (!user) throw new Error('No hay usuario autenticado');

    setIsLoading(true);
    setError(null);

    try {
      const updatedProfile = await authService.updateProfile(user.id, updates);
      setProfile(updatedProfile);
    } catch (err: any) {
      const errorMessage = err.message || 'Error al actualizar perfil';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    user,
    profile,
    isLoading,
    isAuthenticated: !!user && !!profile,
    login,
    register,
    logout,
    updateProfile,
    error,
    clearError
  };
};

export default useAuth;
