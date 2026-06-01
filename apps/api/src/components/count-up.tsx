'use client';

import { animate } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

export function CountUp({
  value,
  duration = 0.9,
  suffix = '',
  decimals = 0,
}: {
  value: number;
  duration?: number;
  suffix?: string;
  decimals?: number;
}) {
  // CRÍTICO de robustez: inicializamos en el valor final, NO en 0. Si la
  // animación no llega a correr (pestaña en background, frame skip), el
  // número queda visible igual. Solo el efecto cliente reinicia el conteo.
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);

  useEffect(() => {
    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      setDisplay(value);
      prev.current = value;
      return;
    }
    const controls = animate(prev.current, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(v),
    });
    prev.current = value;
    return () => controls.stop();
  }, [value, duration]);

  const formatted =
    decimals > 0
      ? display.toFixed(decimals)
      : Math.round(display).toLocaleString('es-CO');

  return (
    <span>
      {formatted}
      {suffix}
    </span>
  );
}
