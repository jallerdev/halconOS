'use client';

import { useEffect, useRef, type RefObject } from 'react';

// Guarda y restaura la posición de scroll para una página/sección dada.
// Por defecto opera sobre `window`; si recibe un `scrollerRef`, opera sobre
// ese elemento (útil para tablas con `overflow-auto` interno o contenedores
// kanban con scroll horizontal). Persiste {x, y} en sessionStorage.
//
// - `key`: identificador estable (ej. "leads", "pipeline-x").
// - `ready`: gate de restore. Restauramos solo cuando el contenido ya está
//   medible, si no scrollTo cae en un contenedor demasiado corto.
// - `scrollerRef`: opcional, ref al elemento scrollable. Si no se pasa, usa
//   window.
export function useScrollRestore(
  key: string,
  ready: boolean,
  scrollerRef?: RefObject<HTMLElement | null>,
) {
  const restoredRef = useRef(false);

  // Restore — una vez, cuando el contenido está listo.
  useEffect(() => {
    if (restoredRef.current) return;
    if (!ready) return;
    if (typeof window === 'undefined') return;
    const target: HTMLElement | Window | null = scrollerRef
      ? scrollerRef.current
      : window;
    if (!target) return;
    const saved = sessionStorage.getItem(`halcon:scroll:${key}`);
    restoredRef.current = true;
    if (!saved) return;
    let pos: unknown;
    try {
      pos = JSON.parse(saved);
    } catch {
      return;
    }
    if (!pos || typeof pos !== 'object') return;
    const x = Number((pos as { x?: number }).x ?? 0);
    const y = Number((pos as { y?: number }).y ?? 0);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    if (x === 0 && y === 0) return;
    requestAnimationFrame(() => {
      if (target instanceof Window) {
        target.scrollTo(x, y);
      } else {
        target.scrollLeft = x;
        target.scrollTop = y;
      }
    });
  }, [key, ready, scrollerRef]);

  // Save — en cada scroll (throttled 150ms). Siempre persiste un valor fresco
  // para que la próxima visita pueda restaurar sin importar cómo se navegó.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const target: HTMLElement | Window | null = scrollerRef
      ? scrollerRef.current
      : window;
    if (!target) return;
    let timer: number | null = null;
    const save = () => {
      timer = null;
      let x = 0;
      let y = 0;
      if (target instanceof Window) {
        x = target.scrollX;
        y = target.scrollY;
      } else {
        x = (target as HTMLElement).scrollLeft;
        y = (target as HTMLElement).scrollTop;
      }
      sessionStorage.setItem(`halcon:scroll:${key}`, JSON.stringify({ x, y }));
    };
    const onScroll = () => {
      if (timer != null) return;
      timer = window.setTimeout(save, 150);
    };
    target.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      target.removeEventListener('scroll', onScroll);
      if (timer != null) clearTimeout(timer);
    };
  }, [key, scrollerRef]);
}
