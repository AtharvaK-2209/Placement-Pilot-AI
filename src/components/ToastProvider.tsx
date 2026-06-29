/**
 * @file ToastProvider.tsx
 * Phase 6A — Global toast provider for app-wide notifications
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import { ToastContainer, setToastListener } from './Toast';
import type { ToastConfig, ToastType } from './Toast';

// ─── Toast Context ─────────────────────────────────────────────────────────────

interface ToastContextValue {
  show: (message: string, type?: ToastType, options?: { description?: string; duration?: number }) => void;
  success: (message: string, description?: string) => void;
  error: (message: string, description?: string) => void;
  warning: (message: string, description?: string) => void;
  info: (message: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

// ─── Toast Provider ────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastConfig[]>([]);

  const show = useCallback((
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
  }, []);

  const success = useCallback((message: string, description?: string) => {
    show(message, 'success', { description });
  }, [show]);

  const error = useCallback((message: string, description?: string) => {
    show(message, 'error', { description });
  }, [show]);

  const warning = useCallback((message: string, description?: string) => {
    show(message, 'warning', { description });
  }, [show]);

  const info = useCallback((message: string, description?: string) => {
    show(message, 'info', { description });
  }, [show]);

  const close = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Set up global toast listener
  React.useEffect(() => {
    setToastListener((toast) => {
      setToasts((prev) => [...prev, toast]);
    });
  }, []);

  return (
    <ToastContext.Provider value={{ show, success, error, warning, info }}>
      {children}
      <ToastContainer toasts={toasts} onClose={close} position="bottom-right" />
    </ToastContext.Provider>
  );
}

// ─── useToast Hook ─────────────────────────────────────────────────────────────

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
