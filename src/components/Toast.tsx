/**
 * @file Toast.tsx
 * Phase 6A — Toast notification system
 * Provides success, error, info, and warning notifications
 */

import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

// ─── Toast Types ───────────────────────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastConfig {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
  description?: string;
}

// ─── Toast Component ───────────────────────────────────────────────────────────

interface ToastProps {
  toast: ToastConfig;
  onClose: (id: string) => void;
}

function Toast({ toast, onClose }: ToastProps) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const duration = toast.duration ?? 3500;
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, duration - 300);

    const closeTimer = setTimeout(() => {
      onClose(toast.id);
    }, duration);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(closeTimer);
    };
  }, [toast, onClose]);

  const config = {
    success: {
      icon: <CheckCircle2 size={20} />,
      bg: 'border-success/30 bg-success/10',
      text: 'text-success',
    },
    error: {
      icon: <XCircle size={20} />,
      bg: 'border-danger/30 bg-danger/10',
      text: 'text-danger',
    },
    warning: {
      icon: <AlertTriangle size={20} />,
      bg: 'border-warning/30 bg-warning/10',
      text: 'text-warning',
    },
    info: {
      icon: <Info size={20} />,
      bg: 'border-accent/30 bg-accent/10',
      text: 'text-accent',
    },
  };

  const style = config[toast.type];

  return (
    <div
      className={[
        'flex items-start gap-3 rounded-xl border px-4 py-3 shadow-xl backdrop-blur-sm transition-all duration-300',
        style.bg,
        isExiting ? 'animate-fade-out opacity-0 translate-x-2' : 'animate-fade-up',
      ].join(' ')}
      role="alert"
    >
      <span className={`shrink-0 ${style.text}`}>{style.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-text-primary">{toast.message}</p>
        {toast.description && (
          <p className="mt-1 text-xs text-text-secondary">{toast.description}</p>
        )}
      </div>
      <button
        onClick={() => {
          setIsExiting(true);
          setTimeout(() => onClose(toast.id), 300);
        }}
        className="shrink-0 text-text-secondary/50 transition-colors hover:text-text-primary"
        aria-label="Close notification"
      >
        <X size={16} />
      </button>
    </div>
  );
}

// ─── Toast Container ───────────────────────────────────────────────────────────

interface ToastContainerProps {
  toasts: ToastConfig[];
  onClose: (id: string) => void;
  position?: 'top-right' | 'top-center' | 'bottom-right' | 'bottom-center';
}

export function ToastContainer({ 
  toasts, 
  onClose, 
  position = 'bottom-right' 
}: ToastContainerProps) {
  const positionClasses = {
    'top-right': 'top-6 right-6',
    'top-center': 'top-6 left-1/2 -translate-x-1/2',
    'bottom-right': 'bottom-6 right-6',
    'bottom-center': 'bottom-6 left-1/2 -translate-x-1/2',
  };

  return (
    <div
      className={`fixed z-50 flex flex-col gap-3 ${positionClasses[position]} max-w-md w-full px-4`}
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  );
}

// ─── Toast Hook ────────────────────────────────────────────────────────────────

export function useToast() {
  const [toasts, setToasts] = useState<ToastConfig[]>([]);

  const show = (
    message: string,
    type: ToastType = 'info',
    options?: { description?: string; duration?: number }
  ) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const toast: ToastConfig = {
      id,
      type,
      message,
      description: options?.description,
      duration: options?.duration,
    };

    setToasts((prev) => [...prev, toast]);
  };

  const success = (message: string, description?: string) => {
    show(message, 'success', { description });
  };

  const error = (message: string, description?: string) => {
    show(message, 'error', { description });
  };

  const warning = (message: string, description?: string) => {
    show(message, 'warning', { description });
  };

  const info = (message: string, description?: string) => {
    show(message, 'info', { description });
  };

  const close = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return {
    toasts,
    show,
    success,
    error,
    warning,
    info,
    close,
  };
}

// ─── Standalone Toast Functions (for non-hook usage) ──────────────────────────

let toastListener: ((toast: ToastConfig) => void) | null = null;

export function setToastListener(listener: (toast: ToastConfig) => void) {
  toastListener = listener;
}

export const toast = {
  success: (message: string, description?: string) => {
    if (toastListener) {
      toastListener({
        id: `toast-${Date.now()}-${Math.random()}`,
        type: 'success',
        message,
        description,
      });
    }
  },
  error: (message: string, description?: string) => {
    if (toastListener) {
      toastListener({
        id: `toast-${Date.now()}-${Math.random()}`,
        type: 'error',
        message,
        description,
      });
    }
  },
  warning: (message: string, description?: string) => {
    if (toastListener) {
      toastListener({
        id: `toast-${Date.now()}-${Math.random()}`,
        type: 'warning',
        message,
        description,
      });
    }
  },
  info: (message: string, description?: string) => {
    if (toastListener) {
      toastListener({
        id: `toast-${Date.now()}-${Math.random()}`,
        type: 'info',
        message,
        description,
      });
    }
  },
};
