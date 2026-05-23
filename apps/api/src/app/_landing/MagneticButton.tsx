'use client';

import { motion, useMotionValue, useSpring } from 'framer-motion';
import Link from 'next/link';
import { useRef, type ReactNode } from 'react';

import { cn } from '~/lib/utils';

type Props = {
  href: string;
  children: ReactNode;
  variant?: 'primary' | 'outline';
  className?: string;
  strength?: number;
};

export function MagneticButton({
  href,
  children,
  variant = 'primary',
  className,
  strength = 0.4,
}: Props) {
  const ref = useRef<HTMLAnchorElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 250, damping: 18, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 250, damping: 18, mass: 0.4 });

  function onMove(e: React.MouseEvent<HTMLAnchorElement>) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * strength);
    y.set((e.clientY - (r.top + r.height / 2)) * strength);
  }

  function reset() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div style={{ x: sx, y: sy }} className="inline-block">
      <Link
        ref={ref}
        href={href}
        onMouseMove={onMove}
        onMouseLeave={reset}
        className={cn(
          'group relative inline-flex h-12 items-center justify-center gap-2 overflow-hidden rounded-xl px-6 text-sm font-semibold transition-colors',
          variant === 'primary'
            ? 'bg-gradient-to-r from-primary to-indigo-500 text-white shadow-lg shadow-primary/30 hover:shadow-primary/50'
            : 'border border-border bg-card/60 text-foreground backdrop-blur hover:border-primary/50 hover:bg-card',
          className,
        )}
      >
        {variant === 'primary' && (
          <span className="pointer-events-none absolute inset-0 -z-0 translate-y-full bg-gradient-to-t from-white/20 to-transparent transition-transform duration-300 group-hover:translate-y-0" />
        )}
        <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
      </Link>
    </motion.div>
  );
}
