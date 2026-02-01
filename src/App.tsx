// ============================================================================
// APP.TSX - Componente principal de DeliveryApp (COMPLETO)
// ============================================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Package, Bike, User, Bell, Star, LogOut, ArrowLeft, 
  Phone, DollarSign, Shield, MapPinned, Loader, History,
  TrendingUp, TrendingDown, CreditCard, X
} from 'lucide-react';

// Contexts
import { AuthProvider, useAuthContext } from './contexts/AuthContext';
import { PedidosProvider, usePedidosContext } from './contexts/PedidosContext';

// Hooks
import { useToast } from './hooks/useToast';
import { useGeolocation } from './hooks/useGeolocation';

// Components
import { ToastContainer } from './components/common/Toast';
import { Button } from './components/common/Button';
import { Modal } from './components/common/Modal';
import { MapaUbicacion } from './components/maps/MapaUbicacion';
import { MapaTracking } from './components/maps/MapaTracking';
import { ChatInterface } from './components/chat/ChatInterface';
import { FormularioNuevoPedido } from './components/cliente/FormularioNuevoPedido';
import { ListaPedidos } from './components/cliente/ListaPedidos';
import { DetallePedido } from './components/cliente/DetallePedido';
import { PedidosDisponibles } from './components/delivery/PedidosDisponibles';
import { PedidosActivos } from './components/delivery/PedidosActivos';

// Services
import { inicializarMercadoPago, simularPago, TARJETA_PRUEBA } from './services/mercadopago';

// Types
import { Pedido, Mensaje, LoginData, Coordenadas } from './types';
import { AUTO_REPLIES, TRACKING_UPDATE_INTERVAL, TRACKING_STEP_SIZE } from './utils/constants';

// ============================================================================
// MAIN APP CONTENT
// ============================================================================
const AppContent: React.FC = () => {
  const { 
    profile, 
    isLoading: authLoading, 
    isAuthenticated,
    userMode,
    setUserMode,
    login,
    register,
    logout
  } = useAuthContext();

  const {
    pedidos,
    pedidosDisponibles,
    misPedidos,
    misEntregas,
    historial,
    resumenFinanciero,
    selectedPedido,
    setSelectedPedido,
    crearPedido,
    aceptarPedido,
    completarPedido,
    cancelarPedido,
    marcarPagado
  } = usePedidosContext();

  const { toasts, showToast, removeToast } = useToast();
  const { location, isLoading: locationLoading, startWatching, stopWatching } = useGeolocation();

  // Estados locales
  const [activeTab, setActiveTab] = useState<string>('nuevo');
  const [showLogin, setShowLogin] = useState(false);
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showTracking, setShowTracking] = useState(false);
  
  const [loginData, setLoginData] = useState<LoginData>({
    email: '',
    password: '',
    nombre: '',
    telefono: '',
    isRegistering: false
  });

  const [chatMessages, setChatMessages] = useState<Record<string, Mensaje[]>>({});
  const [unreadMessages, setUnreadMessages] = useState<Record<string, number>>({});
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const [deliveryPositions, setDeliveryPositions] = useState<Record<string, Coordenadas>>({});
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const autoReplyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Inicializar Mercado Pago
  useEffect(() => {
    inicializarMercadoPago();
  }, []);

  // Iniciar GPS tracking cuando sea delivery
  useEffect(() => {
    if (isAuthenticated && userMode === 'delivery') {
      startWatching();
    }
    return () => stopWatching();
  }, [isAuthenticated, userMode, startWatching, stopWatching]);

  // Simulación de tracking
  useEffect(() => {
    const pedidosEnCamino = pedidos.filter(p => p.estado === 'en-camino' && p.delivery_id);
    if (pedidosEnCamino.length === 0) return;

    pedidosEnCamino.forEach(pedido => {
      if (!deliveryPositions[pedido.id]) {
        setDeliveryPositions(prev => ({ ...prev, [pedido.id]: pedido.coord_origen }));
      }
    });

    const interval = setInterval(() => {
      setDeliveryPositions(prev => {
        const newPositions = { ...prev };
        pedidosEnCamino.forEach(pedido => {
          const currentPos = prev[pedido.id] || pedido.coord_origen;
          const destino = pedido.coord_destino;
          const dLat = destino.lat - currentPos.lat;
          const dLng = destino.lng - currentPos.lng;
          const distance = Math.sqrt(dLat * dLat + dLng * dLng);
          
          if (distance > TRACKING_STEP_SIZE) {
            newPositions[pedido.id] = {
              lat: currentPos.lat + (dLat / distance) * TRACKING_STEP_SIZE,
              lng: currentPos.lng + (dLng / distance) * TRACKING_STEP_SIZE
            };
          } else {
            newPositions[pedido.id] = destino;
          }
        });
        return newPositions;
      });
    }, TRACKING_UPDATE_INTERVAL);

    return () => clearInterval(interval);
  }, [pedidos, deliveryPositions]);

  // ========== HANDLERS ==========
  const handleLogin = async () => {
    try {
      if (loginData.isRegistering) {
        await register(loginData);
        showToast('🎉 Cuenta creada exitosamente', 'success');
      } else {
        await login(loginData.email, loginData.password);
        showToast(`👋 Bienvenido`, 'success');
      }
      setShowLogin(false);
      setShowModeSelector(true);
      setLoginData({ email: '', password: '', nombre: '', telefono: '', isRegistering: false });
    } catch (error: any) {
      showToast(error.message, 'error');
    }
  };

  const handleLogout = async () => {
    await logout();
    setShowProfile(false);
  };

  const handleCambiarModo = (modo: 'cliente' | 'delivery') => {
    setUserMode(modo);
    setShowModeSelector(false);
    setActiveTab(modo === 'delivery' ? 'disponibles' : 'nuevo');
    showToast(`Modo ${modo === 'delivery' ? 'Repartidor 🏍️' : 'Cliente 📦'}`, 'info');
  };

  const handleAceptarPedido = async (pedidoId: string) => {
    if (!profile || !location) return;
    try {
      await aceptarPedido(pedidoId, profile, location);
      showToast('🏍️ Pedido aceptado', 'success');
    } catch (error: any) {
      showToast(error.message, 'error');
    }
  };

  const handleCompletarPedido = async (pedidoId: string) => {
    try {
      await completarPedido(pedidoId);
      const pedido = pedidos.find(p => p.id === pedidoId);
      if (pedido) {
        setSelectedPedido(pedido);
        setShowPayment(true);
      }
      showToast('✅ Entrega completada', 'success');
    } catch (error: any) {
      showToast(error.message, 'error');
    }
  };

  const handleCancelarPedido = async (pedidoId: string) => {
    if (!confirm('¿Cancelar este pedido?')) return;
    try {
      await cancelarPedido(pedidoId);
      showToast('❌ Pedido cancelado', 'info');
    } catch (error: any) {
      showToast(error.message, 'error');
    }
  };

  const handleProcesarPago = async () => {
    if (!selectedPedido) return;
    if (selectedPedido.metodo_pago === 'efectivo') {
      await marcarPagado(selectedPedido.id);
      setShowPayment(false);
      showToast('💵 Cobro confirmado', 'success');
      return;
    }
    setIsProcessingPayment(true);
    try {
      const result = await simularPago(selectedPedido.id);
      if (result.success) {
        await marcarPagado(selectedPedido.id);
        showToast('✅ ¡Pago completado!', 'success');
        setShowPayment(false);
      }
    } catch {
      showToast('Error al procesar el pago', 'error');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleAbrirChat = (pedido: Pedido) => {
    setSelectedPedido(pedido);
    setShowChat(true);
    setUnreadMessages(prev => ({ ...prev, [pedido.id]: 0 }));
  };

  const handleEnviarMensaje = useCallback((texto: string) => {
    if (!selectedPedido || !profile) return;

    const nuevoMensaje: Mensaje = {
      id: Date.now().toString(),
      pedido_id: selectedPedido.id,
      usuario_id: profile.id,
      texto,
      nombre_usuario: profile.nombre,
      timestamp: new Date().toISOString()
    };

    setChatMessages(prev => ({
      ...prev,
      [selectedPedido.id]: [...(prev[selectedPedido.id] || []), nuevoMensaje]
    }));

    // Simular respuesta
    if (autoReplyTimeoutRef.current) clearTimeout(autoReplyTimeoutRef.current);
    autoReplyTimeoutRef.current = setTimeout(() => {
      setIsOtherUserTyping(true);
      setTimeout(() => {
        setIsOtherUserTyping(false);
        const respuesta = AUTO_REPLIES[Math.floor(Math.random() * AUTO_REPLIES.length)];
        const mensajeRespuesta: Mensaje = {
          id: (Date.now() + 1).toString(),
          pedido_id: selectedPedido.id,
          usuario_id: 'bot',
          texto: respuesta,
          nombre_usuario: userMode === 'cliente' ? 'Delivery' : 'Cliente',
          timestamp: new Date().toISOString()
        };
        setChatMessages(prev => ({
          ...prev,
          [selectedPedido.id]: [...(prev[selectedPedido.id] || []), mensajeRespuesta]
        }));
      }, 2000);
    }, 3000);
  }, [selectedPedido, profile, userMode]);

  const handleVerTracking = (pedido: Pedido) => {
    setSelectedPedido(pedido);
    setShowTracking(true);
  };

  const handleCrearPedido = async (nuevoPedido: any) => {
    if (!profile) return;
    await crearPedido(nuevoPedido, profile);
    setActiveTab('mis-pedidos');
  };

  // ========== RENDERS CONDICIONALES ==========
  
  // Loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
        <div className="text-white text-center">
          <Loader className="animate-spin mx-auto mb-4" size={48} />
          <p className="text-xl font-semibold">Cargando...</p>
        </div>
      </div>
    );
  }

  // Perfil
  if (showProfile && profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ToastContainer toasts={toasts} removeToast={removeToast} />
        <div className="bg-blue-600 text-white p-4">
          <div className="max-w-4xl mx-auto flex items-center gap-4">
            <button onClick={() => setShowProfile(false)} className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg">
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-2xl font-bold">Mi Perfil</h1>
          </div>
        </div>
        <div className="max-w-4xl mx-auto p-4 space-y-4">
          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                  {profile.nombre.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{profile.nombre}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <Star className="text-yellow-500 fill-current" size={20} />
                    <span className="font-semibold">{profile.calificacion?.toFixed(1) || '5.0'}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Phone className="text-gray-600" size={20} />
                <span>{profile.telefono}</span>
              </div>
              <div className="flex items-center gap-3">
                <User className="text-gray-600" size={20} />
                <span>{profile.email}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <DollarSign className="text-green-600" size={24} />
              Resumen Financiero
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Como Cliente</p>
                <p className="text-xl font-bold text-blue-600">${resumenFinanciero.totalGastado.toLocaleString()}</p>
                <p className="text-xs text-gray-500">{resumenFinanciero.pedidosCompletados} pedidos</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Como Repartidor</p>
                <p className="text-xl font-bold text-green-600">${resumenFinanciero.totalGanado.toLocaleString()}</p>
                <p className="text-xs text-gray-500">{resumenFinanciero.entregasCompletadas} entregas</p>
              </div>
            </div>
          </div>

          <Button onClick={handleLogout} variant="danger" icon={<LogOut size={20} />} fullWidth>
            Cerrar Sesión
          </Button>
        </div>
      </div>
    );
  }

  // Login
  if (!isAuthenticated) {
    if (showLogin) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
          <ToastContainer toasts={toasts} removeToast={removeToast} />
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
            <button onClick={() => setShowLogin(false)} className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4">
              <ArrowLeft size={20} /> Volver
            </button>
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">DeliverYA</h1>
              <p className="text-gray-600">{loginData.isRegistering ? 'Crear cuenta' : 'Iniciar sesión'}</p>
            </div>
            <div className="space-y-4">
              {loginData.isRegistering && (
                <>
                  <input type="text" placeholder="Nombre completo" value={loginData.nombre}
                    onChange={(e) => setLoginData({...loginData, nombre: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg" />
                  <input type="tel" placeholder="Teléfono" value={loginData.telefono}
                    onChange={(e) => setLoginData({...loginData, telefono: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg" />
                </>
              )}
              <input type="email" placeholder="Email" value={loginData.email}
                onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg" />
              <input type="password" placeholder="Contraseña" value={loginData.password}
                onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg" />
              <Button onClick={handleLogin} variant="primary" fullWidth>
                {loginData.isRegistering ? 'Registrarse' : 'Ingresar'}
              </Button>
              <button onClick={() => setLoginData({...loginData, isRegistering: !loginData.isRegistering})}
                className="w-full text-blue-600 hover:text-blue-700 font-semibold">
                {loginData.isRegistering ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
        <ToastContainer toasts={toasts} removeToast={removeToast} />
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <h1 className="text-3xl font-bold text-center mb-2 text-gray-800">DeliverYA</h1>
          <p className="text-center text-gray-600 mb-8">Envía o reparte con la misma cuenta</p>
          <div className="space-y-4">
            <button onClick={() => setShowLogin(true)}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-xl p-6 transition-all transform hover:scale-105 shadow-lg">
              <User className="mx-auto mb-3" size={48} />
              <h2 className="text-xl font-bold mb-2">Ingresar</h2>
            </button>
            <button onClick={() => { setLoginData({...loginData, isRegistering: true}); setShowLogin(true); }}
              className="w-full bg-purple-500 hover:bg-purple-600 text-white rounded-xl p-6 transition-all transform hover:scale-105 shadow-lg">
              <Star className="mx-auto mb-3" size={48} />
              <h2 className="text-xl font-bold mb-2">Registrarme</h2>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Selector de modo
  if (!userMode || showModeSelector) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
        <ToastContainer toasts={toasts} removeToast={removeToast} />
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-center mb-6">Hola, {profile?.nombre?.split(' ')[0]}!</h1>
          <div className="space-y-4">
            <button onClick={() => handleCambiarModo('cliente')}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-xl p-6 transition-all transform hover:scale-105 shadow-lg">
              <Package className="mx-auto mb-3" size={48} />
              <h2 className="text-xl font-bold mb-2">Necesito un envío</h2>
            </button>
            <button onClick={() => handleCambiarModo('delivery')}
              className="w-full bg-purple-500 hover:bg-purple-600 text-white rounded-xl p-6 transition-all transform hover:scale-105 shadow-lg">
              <Bike className="mx-auto mb-3" size={48} />
              <h2 className="text-xl font-bold mb-2">Quiero repartir</h2>
            </button>
          </div>
          <button onClick={handleLogout}
            className="w-full mt-6 text-gray-500 hover:text-gray-700 font-semibold flex items-center justify-center gap-2">
            <LogOut size={18} /> Cerrar sesión
          </button>
        </div>
      </div>
    );
  }

  // ========== APP PRINCIPAL ==========
  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      {/* Modales */}
      {showPayment && selectedPedido && (
        <Modal isOpen={showPayment} onClose={() => setShowPayment(false)} title="Procesar Pago">
          <div className="p-6">
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="text-3xl font-bold text-center my-4">${selectedPedido.precio}</div>
              <div className="text-sm text-gray-500 text-center">
                {selectedPedido.metodo_pago === 'efectivo' ? '💵 Efectivo' : '💳 Tarjeta'}
              </div>
            </div>
            {selectedPedido.metodo_pago === 'efectivo' ? (
              <Button onClick={handleProcesarPago} variant="success" fullWidth>Confirmar cobro</Button>
            ) : (
              <div className="space-y-4">
                <Button onClick={handleProcesarPago} isLoading={isProcessingPayment} icon={<CreditCard size={24} />} variant="primary" fullWidth size="lg">
                  Pagar con Mercado Pago
                </Button>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
                  <p className="text-yellow-800 font-semibold">🧪 Modo Test</p>
                  <p className="text-yellow-700 text-xs">Tarjeta: {TARJETA_PRUEBA.numero}</p>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {showChat && selectedPedido && profile && (
        <ChatInterface
          pedido={selectedPedido}
          currentUser={profile}
          userMode={userMode}
          messages={chatMessages[selectedPedido.id] || []}
          onSendMessage={handleEnviarMensaje}
          onClose={() => { setShowChat(false); setIsOtherUserTyping(false); }}
          otherUserName={userMode === 'delivery' ? selectedPedido.cliente_nombre || 'Cliente' : selectedPedido.delivery_nombre || 'Delivery'}
          isTyping={isOtherUserTyping}
        />
      )}

      {showTracking && selectedPedido && (
        <MapaTracking
          pedido={selectedPedido}
          deliveryLocation={deliveryPositions[selectedPedido.id] || selectedPedido.coord_origen}
          onClose={() => { setShowTracking(false); setSelectedPedido(null); }}
        />
      )}

      {/* Header */}
      <div className={`${userMode === 'delivery' ? 'bg-purple-600' : 'bg-blue-600'} text-white p-4`}>
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            {userMode === 'delivery' ? <Bike size={28} /> : <Package size={28} />}
            <h1 className="text-2xl font-bold">DeliverYA</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowModeSelector(true)} className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg">
              {userMode === 'delivery' ? <Package size={20} /> : <Bike size={20} />}
            </button>
            <button onClick={() => setShowProfile(true)} className="flex items-center gap-2 hover:bg-white hover:bg-opacity-20 px-3 py-2 rounded-lg">
              <User size={24} />
              <span className="hidden sm:block">{profile?.nombre?.split(' ')[0]}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Indicador de modo */}
      <div className={`${userMode === 'delivery' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'} py-2 px-4 text-center text-sm font-medium`}>
        {userMode === 'delivery' ? '🏍️ Modo Repartidor' : '📦 Modo Cliente'}
      </div>

      {/* Contenido principal */}
      <div className="max-w-4xl mx-auto p-4">
        {/* VISTA DELIVERY */}
        {userMode === 'delivery' && (
          <>
            <div className="bg-white rounded-xl p-4 shadow-md mb-4">
              <div className="flex items-center gap-3 mb-3">
                <MapPinned className="text-green-600" size={24} />
                <div className="font-semibold">Tu ubicación GPS</div>
              </div>
              <MapaUbicacion currentLocation={location} isLoading={locationLoading} />
            </div>

            <div className="flex gap-2 mb-6 bg-white p-2 rounded-lg shadow">
              <button onClick={() => setActiveTab('disponibles')}
                className={`flex-1 py-3 rounded-lg font-semibold ${activeTab === 'disponibles' ? 'bg-purple-500 text-white' : 'bg-gray-100'}`}>
                Disponibles ({pedidosDisponibles.length})
              </button>
              <button onClick={() => setActiveTab('mis-entregas')}
                className={`flex-1 py-3 rounded-lg font-semibold ${activeTab === 'mis-entregas' ? 'bg-purple-500 text-white' : 'bg-gray-100'}`}>
                Mis entregas ({misEntregas.length})
              </button>
              <button onClick={() => setActiveTab('historial')}
                className={`flex-1 py-3 rounded-lg font-semibold flex items-center justify-center gap-1 ${activeTab === 'historial' ? 'bg-purple-500 text-white' : 'bg-gray-100'}`}>
                <History size={16} /> Historial
              </button>
            </div>

            {activeTab === 'disponibles' && (
              <PedidosDisponibles pedidos={pedidosDisponibles} onAceptar={handleAceptarPedido} />
            )}
            {activeTab === 'mis-entregas' && (
              <PedidosActivos pedidos={misEntregas} unreadMessages={unreadMessages} onAbrirChat={handleAbrirChat} onCompletar={handleCompletarPedido} />
            )}
            {activeTab === 'historial' && (
              <DetallePedido historial={historial} resumen={resumenFinanciero} tipo="delivery" />
            )}
          </>
        )}

        {/* VISTA CLIENTE */}
        {userMode === 'cliente' && (
          <>
            <div className="flex gap-2 mb-6 bg-white p-2 rounded-lg shadow">
              <button onClick={() => setActiveTab('nuevo')}
                className={`flex-1 py-3 rounded-lg font-semibold ${activeTab === 'nuevo' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}>
                Nuevo pedido
              </button>
              <button onClick={() => setActiveTab('mis-pedidos')}
                className={`flex-1 py-3 rounded-lg font-semibold ${activeTab === 'mis-pedidos' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}>
                Mis pedidos ({misPedidos.length})
              </button>
              <button onClick={() => setActiveTab('historial')}
                className={`flex-1 py-3 rounded-lg font-semibold flex items-center justify-center gap-1 ${activeTab === 'historial' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}>
                <History size={16} /> Historial
              </button>
            </div>

            {activeTab === 'nuevo' && (
              <FormularioNuevoPedido onSubmit={handleCrearPedido} onSuccess={() => setActiveTab('mis-pedidos')} showToast={showToast} />
            )}
            {activeTab === 'mis-pedidos' && (
              <ListaPedidos pedidos={misPedidos} unreadMessages={unreadMessages} onVerTracking={handleVerTracking} onAbrirChat={handleAbrirChat} onCancelar={handleCancelarPedido} onCrearPedido={() => setActiveTab('nuevo')} />
            )}
            {activeTab === 'historial' && (
              <DetallePedido historial={historial} resumen={resumenFinanciero} tipo="cliente" />
            )}
          </>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// APP WITH PROVIDERS
// ============================================================================
const App: React.FC = () => {
  return (
    <AuthProvider>
      <PedidosProvider>
        <AppContent />
      </PedidosProvider>
    </AuthProvider>
  );
};

export default App;
