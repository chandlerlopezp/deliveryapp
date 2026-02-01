// ============================================================================
// BUTTON COMPONENT - Botón reutilizable
// ============================================================================

import React from 'react';
import { Loader } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  children,
  fullWidth = false,
  disabled,
  className = '',
  ...props
}) => {
  const baseClasses = 'font-semibold rounded-lg transition-colors flex items-center justify-center gap-2';
  
  const variantClasses = {
    primary: 'bg-blue-500 hover:bg-blue-600 text-white disabled:bg-gray-300',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-800 disabled:bg-gray-100',
    success: 'bg-green-500 hover:bg-green-600 text-white disabled:bg-gray-300',
    danger: 'bg-red-500 hover:bg-red-600 text-white disabled:bg-gray-300',
    warning: 'bg-orange-500 hover:bg-orange-600 text-white disabled:bg-gray-300',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-600 disabled:text-gray-300'
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-6 py-4 text-lg'
  };

  const classes = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    fullWidth ? 'w-full' : '',
    disabled || isLoading ? 'cursor-not-allowed' : '',
    className
  ].join(' ');

  return (
    <button
      className={classes}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader className="animate-spin" size={size === 'sm' ? 16 : size === 'lg' ? 24 : 20} />
          <span>Cargando...</span>
        </>
      ) : (
        <>
          {icon}
          {children}
        </>
      )}
    </button>
  );
};

export default Button;
