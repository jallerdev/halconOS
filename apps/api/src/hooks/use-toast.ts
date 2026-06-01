'use client';

import { useEffect, useState } from 'react';

// Toast store + API drop-in compatible con sonner. Mismo shape de llamadas
// (`toast.success(msg)`, `toast.error(msg, { id, duration })`,
// `toast.loading(msg, { id })`, `toast.dismiss(id)`) — los callers existentes
// no necesitan cambios funcionales, sólo cambiar el import path.
//
// Render: <Toaster /> en `lib/trpc.tsx` consume estos toasts vía `useToasts()`.

export type ToastKind = 'success' | 'error' | 'warning' | 'info' | 'loading';

export type ToastEntry = {
  id: string;
  kind: ToastKind;
  message: string;
  body?: string;
  duration: number; // ms, 0 = persistente hasta dismiss explícito
  createdAt: number;
};

type Options = { id?: string; duration?: number; body?: string };

let toasts: ToastEntry[] = [];
let nextId = 1;
const listeners = new Set<(t: ToastEntry[]) => void>();

function emit() {
  const snapshot = [...toasts];
  listeners.forEach((l) => l(snapshot));
}

function genId() {
  // eslint-disable-next-line no-plusplus
  return `t-${nextId++}-${Date.now().toString(36)}`;
}

function add(kind: ToastKind, message: string, opts?: Options): string {
  const id = opts?.id ?? genId();
  // Reemplazar si ya existe un toast con ese id (caso típico: loading → success)
  toasts = toasts.filter((t) => t.id !== id);
  const defaultDuration = kind === 'loading' ? 0 : 6200;
  const duration = opts?.duration ?? defaultDuration;
  toasts.push({
    id,
    kind,
    message,
    body: opts?.body,
    duration,
    createdAt: Date.now(),
  });
  emit();
  if (duration > 0) {
    setTimeout(() => dismiss(id), duration);
  }
  return id;
}

function dismiss(id?: string) {
  toasts = id ? toasts.filter((t) => t.id !== id) : [];
  emit();
}

// API compatible con sonner. Todas las funciones devuelven el id para que
// se pueda dismiss/replace después.
export const toast = {
  success: (message: string, opts?: Options) => add('success', message, opts),
  error: (message: string, opts?: Options) => add('error', message, opts),
  warning: (message: string, opts?: Options) => add('warning', message, opts),
  info: (message: string, opts?: Options) => add('info', message, opts),
  loading: (message: string, opts?: Options) => add('loading', message, opts),
  dismiss,
};

// Hook para que <Toaster /> consuma la cola en vivo.
export function useToasts(): { toasts: ToastEntry[]; dismiss: typeof dismiss } {
  const [snapshot, setSnapshot] = useState<ToastEntry[]>([]);

  useEffect(() => {
    setSnapshot([...toasts]);
    listeners.add(setSnapshot);
    return () => {
      listeners.delete(setSnapshot);
    };
  }, []);

  return { toasts: snapshot, dismiss };
}
