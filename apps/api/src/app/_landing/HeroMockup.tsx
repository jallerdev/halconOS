'use client';

import { motion } from 'framer-motion';
import {
  Boxes,
  CalendarClock,
  FileSpreadsheet,
  KanbanSquare,
  Sparkles,
  TrendingUp,
  Zap,
  type LucideIcon,
} from 'lucide-react';

import { HalconLogo } from '~/components/halcon-logo';

/* ── Sparkline inline (sin dependencias) ── */
function Sparkline({ data, stroke, h = 30 }: { data: number[]; stroke: string; h?: number }) {
  const w = 100;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const rng = max - min || 1;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((d - min) / rng) * (h - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const id = `sl-${stroke.replace(/[^a-z0-9]/gi, '')}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-full w-full">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.28" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${pts.join(' ')} ${w},${h}`} fill={`url(#${id})`} />
      <polyline
        points={pts.join(' ')}
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

const VIOLET = 'hsl(252 100% 68%)';
const TEAL = 'hsl(168 76% 46%)';

const NAV: { icon: LucideIcon; label: string; on?: boolean }[] = [
  { icon: Zap, label: 'Leads', on: true },
  { icon: CalendarClock, label: 'Hoy' },
  { icon: KanbanSquare, label: 'Pipeline' },
  { icon: Boxes, label: 'Proyectos' },
  { icon: FileSpreadsheet, label: 'Importar' },
];

const KPIS = [
  { label: 'Total de leads', value: '1.467', spark: [40, 42, 41, 44, 46, 45, 48, 50, 52, 54, 56, 58], color: VIOLET },
  { label: 'Contactados', value: '214', spark: [12, 14, 13, 16, 18, 17, 20, 22, 21, 24, 23, 26], color: TEAL },
  { label: 'Conversión', value: '6,4%', spark: [7, 7, 6, 7, 6, 6, 7, 6, 6, 5, 6, 6], color: VIOLET },
];

const ROWS = [
  { name: 'El Llanerito Centro', city: 'Medellín', score: 99, status: 'Nuevo', c: '#38bdf8' },
  { name: 'Caimán del Río', city: 'Barranquilla', score: 92, status: 'Ganado', c: '#34d399' },
  { name: 'Panadería La Espiga', city: 'Bogotá', score: 78, status: 'Propuesta', c: '#a78bfa' },
  { name: 'Taller MotorMax', city: 'Cali', score: 64, status: 'Contactado', c: '#818cf8' },
];

function scoreTone(s: number) {
  return s >= 75 ? '#34d399' : s >= 50 ? '#fbbf24' : '#94a3b8';
}

export function HeroMockup() {
  return (
    <div className="relative w-full">
      {/* Halo persistente — vive FUERA del motion.div para no apagarse cuando
          termina el fade-in del mockup. Dos capas: violet rodeando todo el
          panel + acento teal abajo. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-10 rounded-[3rem] bg-primary/25 blur-[80px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-x-12 -bottom-10 h-40 rounded-[3rem] bg-teal-500/18 blur-[70px]"
      />

      <motion.div
        initial={{ y: 24 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative"
      >

      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        className="overflow-hidden rounded-2xl border border-border/70 bg-card/85 text-left shadow-2xl shadow-black/50 backdrop-blur-xl"
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

        <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr]">
          {/* sidebar */}
          <aside className="hidden flex-col gap-1 border-r border-border/60 p-3 sm:flex">
            {NAV.map((n) => (
              <div
                key={n.label}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] ${
                  n.on ? 'bg-accent text-foreground' : 'text-muted-foreground'
                }`}
              >
                <n.icon className="size-4" /> {n.label}
              </div>
            ))}
          </aside>

          {/* main */}
          <main className="min-w-0 p-5">
            <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Pipeline de ventas</div>
            <h3 className="mt-1 text-2xl font-bold tracking-tight">Leads</h3>

            {/* KPIs */}
            <div className="my-4 grid grid-cols-3 gap-3">
              {KPIS.map((k) => (
                <div key={k.label} className="rounded-xl border border-border bg-background/40 p-3">
                  <div className="text-[11px] text-muted-foreground">{k.label}</div>
                  <div className="mt-0.5 text-xl font-bold tracking-tight tabular-nums">{k.value}</div>
                  <div className="mt-2 h-[26px]">
                    <Sparkline data={k.spark} stroke={k.color} />
                  </div>
                </div>
              ))}
            </div>

            {/* table */}
            <div className="overflow-hidden rounded-xl border border-border">
              <div className="grid grid-cols-[58px_1fr_84px] items-center gap-2.5 bg-card px-3.5 py-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                <span>Score</span>
                <span>Negocio</span>
                <span>Estado</span>
              </div>
              {ROWS.map((r, i) => {
                const tone = scoreTone(r.score);
                return (
                  <motion.div
                    key={r.name}
                    initial={{ x: -10 }}
                    animate={{ x: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.06 }}
                    className="grid grid-cols-[58px_1fr_84px] items-center gap-2.5 border-t border-border/60 px-3.5 py-2.5 text-[13px]"
                  >
                    {/* score */}
                    <span className="flex items-center gap-1.5" style={{ color: tone }}>
                      <span className="h-1.5 w-7 overflow-hidden rounded-full bg-muted">
                        <span className="block h-full rounded-full" style={{ width: `${Math.max(8, r.score)}%`, background: tone }} />
                      </span>
                      <span className="text-xs font-bold tabular-nums">{r.score}</span>
                    </span>
                    {/* business */}
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-[10px] font-bold text-primary">
                        {r.name.slice(0, 2)}
                      </span>
                      <div className="min-w-0">
                        <div className="truncate font-medium">{r.name}</div>
                        <div className="text-[11px] text-muted-foreground">{r.city}</div>
                      </div>
                    </div>
                    {/* status */}
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold"
                      style={{ background: `${r.c}1c`, color: r.c, borderColor: `${r.c}33` }}
                    >
                      <span className="size-1.5 rounded-full" style={{ background: r.c }} />
                      {r.status}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </main>
        </div>
      </motion.div>

      {/* floating AI card — asoma fuera de la esquina inferior-derecha del panel */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="pointer-events-none absolute -bottom-6 -right-4 hidden w-52 flex-col gap-3 rounded-2xl border border-primary/40 bg-card p-4 text-left shadow-2xl shadow-black/60 sm:flex"
      >
        <div className="flex items-center gap-2 text-xs font-semibold text-primary">
          <Sparkles className="size-4" /> Propuesta IA
        </div>
        <div className="space-y-1.5">
          {[100, 84, 92, 70, 88].map((w, i) => (
            <motion.div
              key={i}
              initial={{ width: 0 }}
              animate={{ width: `${w}%` }}
              transition={{ duration: 0.5, delay: 0.7 + i * 0.06 }}
              className="h-2 rounded-full bg-foreground/10"
            />
          ))}
        </div>
        <div className="inline-flex items-center gap-1.5 self-start rounded-lg bg-teal-500/15 px-2.5 py-1.5 text-[11px] font-semibold text-teal-600 dark:text-teal-300">
          <TrendingUp className="size-3.5" /> +38% tasa de cierre
        </div>
      </motion.div>
      </motion.div>
    </div>
  );
}
