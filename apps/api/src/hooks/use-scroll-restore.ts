'use client';

import { useEffect, useRef } from 'react';

// Guarda y restaura la posición de scroll de window para una página dada.
// Se usa para mantener al usuario "donde lo dejé" al volver de un detalle
// (/leads/[id]) a la lista origen (/leads, /pipeline). El navegador ya
// restaura scroll para "browser back", pero no para clicks en breadcrumb;
// este hook cubre ambos casos.
//
// - `key`: identificador estable de la página (ej. "leads", "pipeline").
// - `ready`: cuándo el contenido ya está medible. Si lo restauras antes de
//   que rendericen las filas, scrollTo cae en blanco porque el doc es corto.
export function useScrollRestore(key: string, ready: boolean) {
  const restoredRef = useRef(false);

  // Restore: una sola vez por mount, cuando el contenido está listo.
  useEffect(() => {
    if (restoredRef.current) return;
    if (!ready) return;
    if (typeof window === 'undefined') return;
    const saved = sessionStorage.getItem(`halcon:scroll:${key}`);
    restoredRef.current = true;
    if (saved == null) return;
    const y = Number(saved);
    if (!Number.isFinite(y) || y <= 0) return;
    // requestAnimationFrame para esperar el commit del DOM tras `ready`.
    requestAnimationFrame(() => window.scrollTo(0, y));
  }, [key, ready]);

  // Save: en cada scroll (throttled 150ms) guardamos la posición. Así no
  // dependemos de interceptar la navegación — siempre hay un valor fresco.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let timer: number | null = null;
    const save = () => {
      timer = null;
      sessionStorage.setItem(`halcon:scroll:${key}`, String(window.scrollY));
    };
    const onScroll = () => {
      if (timer != null) return;
      timer = window.setTimeout(save, 150);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (timer != null) clearTimeout(timer);
    };
  }, [key]);
}
