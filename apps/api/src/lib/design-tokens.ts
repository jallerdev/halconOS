// Design tokens — fuente única de verdad para el sistema visual "Atrevida".
//
// • Marca dual violet (acento principal) + teal (datos/positivo).
// • Status hues por lead y por proyecto — usados por LeadsTable border-l,
//   KanbanBoard column dot, LeadStatusBadge, StatusSelect, Timeline tone.
// • Avatar palette — 8 colores deterministicos por hash(name).
// • Score tone — threshold por valor de score.
//
// Si necesitas un fondo / borde / acento nuevo, AMPLIA este archivo antes
// de meter clases sueltas en componentes. Tailwind necesita ver las strings
// en el código fuente para no purgarlas — por eso están literales aquí.

import type { LeadStatus, ProjectStatus } from '@halcon-os/shared/enums';

// ─────────────────────── Surface ───────────────────────

export const SURFACE = {
  // Background de página completa (transparente — debajo está AppBg).
  base: 'bg-background',
  // Único nivel "elevado" — cards, top bar, sidebar, popovers persistentes.
  elevated: 'border border-border bg-card/98 shadow-card',
  // Variante sin border, más translúcida (ej. row hover de tabla).
  subtle: 'bg-card/40',
} as const;

export const HOVER = {
  border: 'hover:border-border-strong',
  bg: 'hover:bg-accent',
  text: 'hover:text-foreground',
} as const;

// ─────────────────────── Brand ───────────────────────

export const BRAND = {
  violet: 'hsl(252 100% 68%)',
  teal: 'hsl(168 76% 46%)',
  gradient: 'linear-gradient(135deg, hsl(252 100% 68%), hsl(168 76% 46%))',
} as const;

// Acento por página. En «Atrevida» casi todo es violet; usamos teal solo donde
// queremos resaltar "datos vivos" (ej. conversión exitosa). Las MISMAS claves
// que existían cuando el sistema era multicolor — todas resuelven a violet
// o teal para no romper imports.
export const PAGE_ACCENT = {
  leads: 'violet',
  today: 'teal',
  pipeline: 'violet',
  projects: 'teal',
  settings: 'violet',
  discover: 'violet',
  notifications: 'violet',
} as const;

// AccentColor PERMISIVA: conserva los nombres antiguos (sky/amber/emerald/blue)
// para que cualquier call-site existente siga compilando, pero TODOS se
// remapean a violet o teal. Así se re-tona toda la app sin tocar cada página.
export type AccentColor = 'violet' | 'teal' | 'sky' | 'amber' | 'emerald' | 'blue';

export const ACCENT_TEXT: Record<AccentColor, string> = {
  violet: 'text-[hsl(var(--violet))]',
  teal: 'text-[hsl(var(--teal))]',
  // Legacy — todos colapsan a la marca.
  sky: 'text-[hsl(var(--violet))]',
  amber: 'text-[hsl(var(--violet))]',
  blue: 'text-[hsl(var(--violet))]',
  emerald: 'text-[hsl(var(--teal))]',
};

export const ACCENT_BG_SOFT: Record<AccentColor, string> = {
  violet: 'bg-[hsl(var(--violet))]/14',
  teal: 'bg-[hsl(var(--teal))]/14',
  sky: 'bg-[hsl(var(--violet))]/14',
  amber: 'bg-[hsl(var(--violet))]/14',
  blue: 'bg-[hsl(var(--violet))]/14',
  emerald: 'bg-[hsl(var(--teal))]/14',
};

// Color de trazo (hsl real) para sparklines/charts. No usar nombres de Tremor.
export const ACCENT_STROKE: Record<AccentColor, string> = {
  violet: 'hsl(252 100% 68%)',
  teal: 'hsl(168 76% 46%)',
  sky: 'hsl(252 100% 68%)',
  amber: 'hsl(252 100% 68%)',
  blue: 'hsl(252 100% 68%)',
  emerald: 'hsl(168 76% 46%)',
};

// ─────────────────────── Status hue (lead) ───────────────────────

// Lead statuses → hue (bg soft + text + dot sólido). Match con el design
// handoff (sky / violet / amber / indigo / blue / emerald / rose).
// Las strings DEBEN estar literales aquí para que Tailwind JIT las detecte.
export type StatusHue = {
  bg: string;
  text: string;
  border: string;
  dot: string;
  // hex para usar inline (border-l del row de la tabla, columna del kanban)
  // donde necesitamos el color HSL como CSS value, no como utility class.
  hsl: string;
};

export const STATUS_HUE: Record<LeadStatus, StatusHue> = {
  NEW: {
    bg: 'bg-violet-500/15',
    text: 'text-violet-300',
    border: 'border-violet-500/30',
    dot: 'bg-violet-500',
    hsl: 'hsl(258 90% 66%)',
  },
  CONTACTED: {
    bg: 'bg-sky-500/15',
    text: 'text-sky-300',
    border: 'border-sky-500/30',
    dot: 'bg-sky-500',
    hsl: 'hsl(199 89% 48%)',
  },
  QUALIFIED: {
    bg: 'bg-amber-500/15',
    text: 'text-amber-300',
    border: 'border-amber-500/30',
    dot: 'bg-amber-500',
    hsl: 'hsl(38 92% 50%)',
  },
  PROPOSAL_SENT: {
    bg: 'bg-indigo-500/15',
    text: 'text-indigo-300',
    border: 'border-indigo-500/30',
    dot: 'bg-indigo-500',
    hsl: 'hsl(239 84% 67%)',
  },
  NEGOTIATION: {
    bg: 'bg-blue-500/15',
    text: 'text-blue-300',
    border: 'border-blue-500/30',
    dot: 'bg-blue-500',
    hsl: 'hsl(217 91% 60%)',
  },
  WON: {
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-300',
    border: 'border-emerald-500/30',
    dot: 'bg-emerald-500',
    hsl: 'hsl(160 84% 39%)',
  },
  LOST: {
    bg: 'bg-rose-500/15',
    text: 'text-rose-300',
    border: 'border-rose-500/30',
    dot: 'bg-rose-500',
    hsl: 'hsl(347 89% 60%)',
  },
};

// ─────────────────────── Status hue (proyecto) ───────────────────────

export const PROJECT_STATUS_HUE: Record<ProjectStatus, StatusHue> = {
  PLANNING: {
    bg: 'bg-sky-500/15',
    text: 'text-sky-300',
    border: 'border-sky-500/30',
    dot: 'bg-sky-500',
    hsl: 'hsl(199 89% 48%)',
  },
  IN_PROGRESS: {
    bg: 'bg-violet-500/15',
    text: 'text-violet-300',
    border: 'border-violet-500/30',
    dot: 'bg-violet-500',
    hsl: 'hsl(258 90% 66%)',
  },
  REVIEW: {
    bg: 'bg-amber-500/15',
    text: 'text-amber-300',
    border: 'border-amber-500/30',
    dot: 'bg-amber-500',
    hsl: 'hsl(38 92% 50%)',
  },
  DELIVERED: {
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-300',
    border: 'border-emerald-500/30',
    dot: 'bg-emerald-500',
    hsl: 'hsl(160 84% 39%)',
  },
  ON_HOLD: {
    bg: 'bg-zinc-500/15',
    text: 'text-zinc-300',
    border: 'border-zinc-500/30',
    dot: 'bg-zinc-500',
    hsl: 'hsl(240 5% 65%)',
  },
  CANCELLED: {
    bg: 'bg-rose-500/15',
    text: 'text-rose-300',
    border: 'border-rose-500/30',
    dot: 'bg-rose-500',
    hsl: 'hsl(347 89% 60%)',
  },
};

// ─────────────────────── Avatar palette ───────────────────────

// 8 colores deterministicos por hash(name). Match exacto del handoff —
// rose / amber / emerald / sky / violet / fuchsia / teal / indigo.
// `hash(name) % 8` indexa esta tabla.
export const AVATAR_PALETTE = [
  { bg: 'bg-rose-500/16', text: 'text-rose-400' },
  { bg: 'bg-amber-500/16', text: 'text-amber-400' },
  { bg: 'bg-emerald-500/16', text: 'text-emerald-400' },
  { bg: 'bg-sky-500/16', text: 'text-sky-400' },
  { bg: 'bg-violet-500/16', text: 'text-violet-400' },
  { bg: 'bg-fuchsia-500/16', text: 'text-fuchsia-400' },
  { bg: 'bg-teal-500/16', text: 'text-teal-400' },
  { bg: 'bg-indigo-500/16', text: 'text-indigo-400' },
] as const;

// ─────────────────────── Score tone ───────────────────────

// Threshold del badge de score (0–100):
//   >= 75  → teal (excelente lead)
//   >= 50  → amber (potencial medio)
//   else   → muted (frío)
export type ScoreTone = {
  text: string;
  bg: string;
  // hex para inline width fill de la barra (score-track)
  hsl: string;
};

export function scoreTone(n: number): ScoreTone {
  if (n >= 75) return { text: 'text-[hsl(var(--teal))]', bg: 'bg-[hsl(var(--teal))]', hsl: 'hsl(168 76% 46%)' };
  if (n >= 50) return { text: 'text-amber-400', bg: 'bg-amber-400', hsl: 'hsl(38 92% 55%)' };
  return { text: 'text-muted-foreground', bg: 'bg-muted-foreground/60', hsl: 'hsl(240 5% 65%)' };
}

// ─────────────────────── Toast type → look ───────────────────────

// Cada toast tiene un accent color + un icon name (string que el Toaster
// resuelve a un lucide-react component). Toast custom (Fase 7) consume esto.
export type ToastKind = 'success' | 'error' | 'info' | 'meeting' | 'lead' | 'won';

export const TOAST_KIND: Record<ToastKind, { accent: string; icon: string }> = {
  success: { accent: 'hsl(168 76% 46%)', icon: 'CheckCircle2' },
  error: { accent: 'hsl(347 89% 60%)', icon: 'AlertTriangle' },
  info: { accent: 'hsl(199 89% 48%)', icon: 'Info' },
  meeting: { accent: 'hsl(252 100% 68%)', icon: 'Video' },
  lead: { accent: 'hsl(252 100% 68%)', icon: 'Zap' },
  won: { accent: 'hsl(168 76% 46%)', icon: 'Trophy' },
};
