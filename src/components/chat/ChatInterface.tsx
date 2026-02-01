// ============================================================================
// CHAT INTERFACE COMPONENT - Chat mejorado con avatares y respuestas
// ============================================================================

import React, { useEffect, useRef, useState } from 'react';
import { X, Send, MessageCircle } from 'lucide-react';
import { Pedido, Mensaje, Usuario } from '../../types';
import { getInicial, formatearHora } from '../../utils/helpers';

interface ChatInterfaceProps {
  pedido: Pedido;
  currentUser: Usuario;
  userMode: 'cliente' | 'delivery';
  messages: Mensaje[];
  onSendMessage: (texto: string) => void;
  onClose: () => void;
  otherUserName: string;
  isTyping?: boolean;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  pedido,
  currentUser,
  userMode,
  messages,
  onSendMessage,
  onClose,
  otherUserName,
  isTyping = false
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState('');

  // Auto-scroll al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!inputValue.trim()) return;
    onSendMessage(inputValue);
    setInputValue('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getAvatarColor = (isCurrentUser: boolean) => {
    if (userMode === 'delivery') {
      return isCurrentUser ? 'bg-purple-500' : 'bg-blue-500';
    }
    return isCurrentUser ? 'bg-blue-500' : 'bg-purple-500';
  };

  const headerColor = userMode === 'delivery' ? 'bg-purple-600' : 'bg-blue-600';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full h-[500px] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className={`p-4 flex justify-between items-center ${headerColor} text-white`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${userMode === 'delivery' ? 'bg-blue-500' : 'bg-purple-500'}`}>
              {getInicial(otherUserName)}
            </div>
            <div>
              <div className="font-bold">{otherUserName || 'Usuario'}</div>
              <div className="text-xs flex items-center gap-1">
                {isTyping ? (
                  <>
                    <span className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </span>
                    <span className="ml-1">Escribiendo...</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                    <span>En línea</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Info del pedido */}
        <div className="bg-gray-100 px-4 py-2 text-xs text-gray-600 flex items-center justify-between border-b">
          <span>Pedido #{pedido.id}</span>
          <span className="font-semibold text-green-600">${pedido.precio}</span>
        </div>

        {/* Área de mensajes */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.length === 0 && !isTyping && (
            <div className="text-center text-gray-400 mt-12">
              <MessageCircle className="mx-auto mb-3 opacity-50" size={48} />
              <p className="text-sm">Inicia la conversación</p>
              <p className="text-xs mt-1">Los mensajes se guardan automáticamente</p>
            </div>
          )}
          
          {messages.map((msg, index) => {
            const isCurrentUser = msg.usuario_id === currentUser.id;
            return (
              <div
                key={msg.id || index}
                className={`flex items-end gap-2 ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${getAvatarColor(isCurrentUser)}`}>
                  {getInicial(isCurrentUser ? currentUser.nombre : otherUserName)}
                </div>
                
                {/* Burbuja */}
                <div className={`max-w-[70%] ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                  <div 
                    className={`rounded-2xl px-4 py-2 ${
                      isCurrentUser 
                        ? 'bg-blue-500 text-white rounded-br-md' 
                        : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md shadow-sm'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.texto}</p>
                  </div>
                  <div className={`text-xs text-gray-400 mt-1 ${isCurrentUser ? 'text-right' : 'text-left'}`}>
                    {formatearHora(msg.timestamp)}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Indicador de escribiendo */}
          {isTyping && (
            <div className="flex items-end gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${userMode === 'delivery' ? 'bg-blue-500' : 'bg-purple-500'}`}>
                {getInicial(otherUserName)}
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input de mensaje */}
        <div className="p-4 border-t bg-white">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Escribe un mensaje..."
              className="flex-1 p-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim()}
              className={`p-3 rounded-full transition-colors ${
                inputValue.trim() 
                  ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
