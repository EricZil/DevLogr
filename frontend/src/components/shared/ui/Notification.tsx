'use client';

import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface NotificationProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose: () => void;
  position?: 'top-right' | 'top-left' | 'top-center' | 'bottom-right' | 'bottom-left' | 'bottom-center';
}

const Notification = ({ 
  message, 
  type, 
  duration = 4000, 
  onClose, 
  position = 'top-right' 
}: NotificationProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  const handleClose = useCallback(() => {
    setIsLeaving(true);
    setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 150);
    }, 300);
  }, [onClose]);

  useEffect(() => {
    setMounted(true);
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, handleClose]);

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-gradient-to-r from-emerald-500/90 to-green-500/90',
          border: 'border-emerald-400/50',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ),
          shadow: 'shadow-emerald-500/25'
        };
      case 'error':
        return {
          bg: 'bg-gradient-to-r from-red-500/90 to-rose-500/90',
          border: 'border-red-400/50',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ),
          shadow: 'shadow-red-500/25'
        };
      case 'warning':
        return {
          bg: 'bg-gradient-to-r from-amber-500/90 to-orange-500/90',
          border: 'border-amber-400/50',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          ),
          shadow: 'shadow-amber-500/25'
        };
      case 'info':
        return {
          bg: 'bg-gradient-to-r from-blue-500/90 to-cyan-500/90',
          border: 'border-blue-400/50',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          shadow: 'shadow-blue-500/25'
        };
    }
  };

  const getPositionStyles = () => {
    switch (position) {
      case 'top-right':
        return 'top-6 right-6';
      case 'top-left':
        return 'top-6 left-6';
      case 'top-center':
        return 'top-6 left-1/2 transform -translate-x-1/2';
      case 'bottom-right':
        return 'bottom-6 right-6';
      case 'bottom-left':
        return 'bottom-6 left-6';
      case 'bottom-center':
        return 'bottom-6 left-1/2 transform -translate-x-1/2';
      default:
        return 'top-6 right-6';
    }
  };

  const typeStyles = getTypeStyles();

  if (!mounted) return null;

  const notificationElement = (
    <div
      className={`
        fixed ${getPositionStyles()} z-[99999] 
        transition-all duration-500 ease-out
        ${isVisible && !isLeaving 
          ? 'opacity-100 translate-y-0 scale-100' 
          : 'opacity-0 -translate-y-4 scale-95'
        }
      `}
      style={{
        filter: 'drop-shadow(0 25px 25px rgb(0 0 0 / 0.15))',
      }}
    >
      <div
        className={`
          ${typeStyles.bg} ${typeStyles.border} ${typeStyles.shadow}
          backdrop-blur-xl border rounded-2xl 
          px-6 py-4 max-w-sm min-w-[320px]
          shadow-2xl
          relative overflow-hidden
          transform transition-all duration-300 ease-out
          hover:scale-105 hover:shadow-3xl
        `}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/5 to-transparent opacity-50 animate-pulse"></div>
        
        {duration > 0 && (
          <div className="absolute bottom-0 left-0 h-1 bg-white/30 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white/60 rounded-full transition-all ease-linear"
              style={{
                width: '100%',
                animation: `shrink ${duration}ms linear forwards`
              }}
            />
          </div>
        )}

        <div className="relative z-10 flex items-start space-x-4">
          <div className="flex-shrink-0 mt-0.5">
            <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white">
              {typeStyles.icon}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-white font-medium text-sm leading-relaxed break-words">
              {message}
            </p>
          </div>

          <button
            onClick={handleClose}
            className="flex-shrink-0 ml-2 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-200 text-white hover:scale-110"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 animate-shine"></div>
        </div>
      </div>
    </div>
  );

  return createPortal(notificationElement, document.body);
};

export default Notification; 