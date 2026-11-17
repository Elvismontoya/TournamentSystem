import { createContext, useContext } from 'react';

// Toast notifications: short messages in a corner of the screen ("Torneo creado", "No se
// pudo guardar…") that close by themselves. Shown by ToastProvider.

export type ToastTone = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  tone: ToastTone;
  title: string;
  text?: string;
}

export interface ToastApi {
  success: (title: string, text?: string) => void;
  error: (title: string, text?: string) => void;
  info: (title: string, text?: string) => void;
}

export const ToastContext = createContext<ToastApi | null>(null);

/** Shows toast notifications. Needs a ToastProvider above (it wraps the whole app). */
export function useToast(): ToastApi {
  const api = useContext(ToastContext);
  if (!api) throw new Error('useToast necesita un <ToastProvider> por encima.');
  return api;
}
