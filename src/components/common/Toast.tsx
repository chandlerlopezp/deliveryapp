// ============================================================================
// TOAST COMPONENT - Notificaciones toast
// ============================================================================

import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';
import { Toast as ToastType } from '../../types';

interface ToastProps {
  toast: ToastType;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    warning: 'bg-orange-500'
  };

  const icons = {
    success: CheckCircle,
    error: XCircle,
    info: AlertCircle,
    warning: AlertCircle
  };

  const Icon = icons[toast.type] || CheckCircle;
  const bgColor = bgColors[toast.type] || 'bg-green-500';

  return (
    <div 
      className={`${bgColor} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-slide-in min-w-[280px]`}
    >
      <Icon size={20} />
      <span className="flex-1">{toast.message}</span>
      <button 
        onClick={onClose} 
        className="hover:bg-white hover:bg-opacity-20 rounded p-1"
      >
        <X size={16} />
      </button>
      <style>{`
        @keyframes slide-in {
          from { transform: translateY(-100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-in { animation: slide-in 0.3s ease-out; }
      `}</style>
    </div>
  );
};

interface ToastContainerProps {
  toasts: ToastType[];
  removeToast: (id: number) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map(toast => (
        <Toast 
          key={toast.id} 
          toast={toast}
          onClose={() => removeToast(toast.id)} 
        />
      ))}
    </div>
  );
};

export default Toast;
