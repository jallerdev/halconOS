'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type SidebarContextValue = {
  collapsed: boolean;
  setCollapsed: (value: boolean) => void;
  toggle: () => void;
};

const SidebarContext = createContext<SidebarContextValue | null>(null);
const STORAGE_KEY = 'halcon:sidebar:collapsed';

// Comparte el estado collapsed entre Sidebar (que lee para renderizar slim
// vs expanded) y TopBar (que tiene el botón para alternar). Persiste en
// localStorage para que la preferencia sobreviva al refresh.
export function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsedState] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === '1') setCollapsedState(true);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, collapsed ? '1' : '0');
  }, [collapsed, hydrated]);

  const value: SidebarContextValue = {
    collapsed,
    setCollapsed: setCollapsedState,
    toggle: () => setCollapsedState((c) => !c),
  };

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

export function useSidebar(): SidebarContextValue {
  const ctx = useContext(SidebarContext);
  if (!ctx) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return ctx;
}
