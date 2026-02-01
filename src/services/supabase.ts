// ============================================================================
// SUPABASE SERVICE - Cliente y funciones de Supabase
// ============================================================================

import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../utils/constants';
import { Usuario, Pedido, Mensaje, TrackingPoint, Transaccion } from '../types';
import { pedidoFromDB, pedidoToDB } from '../utils/helpers';

// Crear cliente de Supabase
export const supabase: SupabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// ============================================================================
// AUTH FUNCTIONS
// ============================================================================

export const authService = {
  async signUp(email: string, password: string, userData: Partial<Usuario>) {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password
    });

    if (authError) throw authError;

    if (authData.user) {
      // Crear perfil en tabla usuarios
      const { error: profileError } = await supabase
        .from('usuarios')
        .insert({
          id: authData.user.id,
          email,
          nombre: userData.nombre,
          telefono: userData.telefono,
          calificacion: 5.0,
          role: 'cliente',
          created_at: new Date().toISOString()
        });

      if (profileError) throw profileError;
    }

    return authData;
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  async getProfile(userId: string): Promise<Usuario | null> {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  },

  async updateProfile(userId: string, updates: Partial<Usuario>) {
    const { data, error } = await supabase
      .from('usuarios')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  onAuthStateChange(callback: (user: User | null) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(session?.user || null);
    });
  }
};

// ============================================================================
// PEDIDOS FUNCTIONS
// ============================================================================

export const pedidosService = {
  async crear(pedido: Omit<Pedido, 'id' | 'created_at'>) {
    const dbPedido = pedidoToDB(pedido);
    const { data, error } = await supabase
      .from('pedidos')
      .insert({
        ...dbPedido,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return pedidoFromDB(data);
  },

  async obtenerPorId(id: string): Promise<Pedido | null> {
    const { data, error } = await supabase
      .from('pedidos')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return pedidoFromDB(data);
  },

  async obtenerDisponibles(): Promise<Pedido[]> {
    const { data, error } = await supabase
      .from('pedidos')
      .select('*')
      .eq('estado', 'pendiente')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(pedidoFromDB);
  },

  async obtenerPorCliente(clienteId: string): Promise<Pedido[]> {
    const { data, error } = await supabase
      .from('pedidos')
      .select('*')
      .eq('cliente_id', clienteId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(pedidoFromDB);
  },

  async obtenerPorDelivery(deliveryId: string): Promise<Pedido[]> {
    const { data, error } = await supabase
      .from('pedidos')
      .select('*')
      .eq('delivery_id', deliveryId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(pedidoFromDB);
  },

  async aceptar(pedidoId: string, deliveryId: string, deliveryNombre: string) {
    const { data, error } = await supabase
      .from('pedidos')
      .update({
        estado: 'en-camino',
        delivery_id: deliveryId,
        delivery_nombre: deliveryNombre,
        aceptado_at: new Date().toISOString()
      })
      .eq('id', pedidoId)
      .select()
      .single();

    if (error) throw error;
    return pedidoFromDB(data);
  },

  async completar(pedidoId: string) {
    const { data, error } = await supabase
      .from('pedidos')
      .update({
        estado: 'completado',
        completado_at: new Date().toISOString()
      })
      .eq('id', pedidoId)
      .select()
      .single();

    if (error) throw error;
    return pedidoFromDB(data);
  },

  async cancelar(pedidoId: string) {
    const { data, error } = await supabase
      .from('pedidos')
      .update({
        estado: 'cancelado',
        cancelado_at: new Date().toISOString()
      })
      .eq('id', pedidoId)
      .select()
      .single();

    if (error) throw error;
    return pedidoFromDB(data);
  },

  async marcarPagado(pedidoId: string) {
    const { data, error } = await supabase
      .from('pedidos')
      .update({
        estado_pago: 'pagado',
        pago_completado_at: new Date().toISOString()
      })
      .eq('id', pedidoId)
      .select()
      .single();

    if (error) throw error;
    return pedidoFromDB(data);
  },

  // Suscripción en tiempo real
  subscribeToChanges(callback: (pedido: Pedido) => void) {
    return supabase
      .channel('pedidos-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pedidos' },
        (payload) => {
          callback(pedidoFromDB(payload.new));
        }
      )
      .subscribe();
  }
};

// ============================================================================
// MENSAJES (CHAT) FUNCTIONS
// ============================================================================

export const mensajesService = {
  async enviar(mensaje: Omit<Mensaje, 'id'>) {
    const { data, error } = await supabase
      .from('mensajes')
      .insert(mensaje)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async obtenerPorPedido(pedidoId: string): Promise<Mensaje[]> {
    const { data, error } = await supabase
      .from('mensajes')
      .select('*')
      .eq('pedido_id', pedidoId)
      .order('timestamp', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Suscripción en tiempo real
  subscribeToPedido(pedidoId: string, callback: (mensaje: Mensaje) => void) {
    return supabase
      .channel(`mensajes-${pedidoId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mensajes',
          filter: `pedido_id=eq.${pedidoId}`
        },
        (payload) => {
          callback(payload.new as Mensaje);
        }
      )
      .subscribe();
  }
};

// ============================================================================
// TRACKING FUNCTIONS
// ============================================================================

export const trackingService = {
  async guardar(tracking: Omit<TrackingPoint, 'id'>) {
    const { data, error } = await supabase
      .from('tracking')
      .insert(tracking)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async obtenerUltimo(pedidoId: string): Promise<TrackingPoint | null> {
    const { data, error } = await supabase
      .from('tracking')
      .select('*')
      .eq('pedido_id', pedidoId)
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Suscripción en tiempo real
  subscribeToPedido(pedidoId: string, callback: (tracking: TrackingPoint) => void) {
    return supabase
      .channel(`tracking-${pedidoId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tracking',
          filter: `pedido_id=eq.${pedidoId}`
        },
        (payload) => {
          callback(payload.new as TrackingPoint);
        }
      )
      .subscribe();
  }
};

// ============================================================================
// TRANSACCIONES FUNCTIONS
// ============================================================================

export const transaccionesService = {
  async crear(transaccion: Omit<Transaccion, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('transacciones')
      .insert({
        ...transaccion,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async actualizar(id: string, updates: Partial<Transaccion>) {
    const { data, error } = await supabase
      .from('transacciones')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async obtenerPorPedido(pedidoId: string): Promise<Transaccion | null> {
    const { data, error } = await supabase
      .from('transacciones')
      .select('*')
      .eq('pedido_id', pedidoId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }
};

export default supabase;
