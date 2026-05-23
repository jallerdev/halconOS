'use client';

import { motion } from 'framer-motion';
import { Sparkles, Star, TrendingUp } from 'lucide-react';

import { HalconLogo } from '~/components/halcon-logo';

const ROWS = [
  { name: 'Caimán del Río', city: 'Medellín', score: 92, status: 'WON', tone: 'emerald' },
  { name: 'Panadería La Espiga', city: 'Bogotá', score: 78, status: 'PROPUESTA', tone: 'indigo' },
  { name: 'Taller MotorMax', city: 'Cali', score: 64, status: 'CONTACTADO', tone: 'sky' },
  { name: 'Veterinaria Patitas', city: 'Barranquilla', score: 55, status: 'NUEVO', tone: 'zinc' },
];

const toneMap: Record<string, string> = {
  emerald: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  indigo: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
  sky: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  zinc: 'bg-zinc-500/15 text-zinc-300 border-zinc-500/30',
};

export function HeroMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, rotateX: 12 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
      style={{ perspective: 1200 }}
      className="relative mx-auto mt-16 w-full max-w-4xl"
    >
      {/* glow under panel */}
      <div
        aria-hidden
        className="absolute -inset-x-10 -top-6 bottom-0 -z-10 rounded-[2rem] bg-primary/20 blur-3xl"
      />

      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="overflow-hidden rounded-2xl border border-border/70 bg-card/80 shadow-2xl shadow-black/50 backdrop-blur-xl"
      >
        {/* window chrome */}
        <div className="flex items-center gap-2 border-b border-border/60 bg-background/50 px-4 py-3">
          <span className="size-3 rounded-full bg-rose-500/70" />
          <span className="size-3 rounded-full bg-amber-500/70" />
          <span className="size-3 rounded-full bg-emerald-500/70" />
          <div className="ml-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <HalconLogo className="size-3.5" /> halcon.os / leads
          </div>
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-[1fr_240px]">
          {/* table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1 pb-1 text-[11px] uppercase tracking-wider text-muted-foreground">
              <span>Negocio</span>
              <span>Score</span>
            </div>
            {ROWS.map((r, i) => (
              <motion.div
                key={r.name}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.6 + i * 0.12 }}
                className="flex items-center gap-3 rounded-xl border border-border/50 bg-background/40 px-3 py-2.5"
              >
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-xs font-semibold text-primary">
                  {r.name.slice(0, 2)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{r.name}</div>
                  <div className="text-[11px] text-muted-foreground">{r.city}</div>
                </div>
                <span
                  className={`hidden rounded-full border px-2 py-0.5 text-[10px] font-medium sm:inline ${toneMap[r.tone]}`}
                >
                  {r.status}
                </span>
                <div className="flex items-center gap-1 text-sm font-semibold tabular-nums">
                  <Star className="size-3.5 text-primary" />
                  {r.score}
                </div>
              </motion.div>
            ))}
          </div>

          {/* AI side card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 1.1 }}
            className="flex flex-col gap-3 rounded-xl border border-primary/30 bg-primary/[0.06] p-4"
          >
            <div className="flex items-center gap-2 text-xs font-medium text-primary">
              <Sparkles className="size-4" /> Propuesta IA
            </div>
            <div className="space-y-1.5">
              {[100, 85, 92, 70, 88].map((w, i) => (
                <motion.div
                  key={i}
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: `${w}%`, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 1.3 + i * 0.1 }}
                  className="h-2 rounded-full bg-foreground/10"
                />
              ))}
            </div>
            <div className="mt-auto flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-2.5 py-1.5 text-[11px] font-medium text-emerald-300">
              <TrendingUp className="size-3.5" /> +38% tasa de cierre
            </div>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}
