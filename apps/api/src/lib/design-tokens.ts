// Design tokens — fuente única de verdad para tratamientos de superficie y
// acentos por página. Si una clase de fondo / borde no aparece aquí, NO
// agregarla al dashboard a mano: extender este archivo primero.

export const SURFACE = {
  // Background de página completa.
  base: 'bg-background',
  // Único nivel "elevado" — cards, top bar, sidebar, popovers persistentes.
  // bg-card/60 + border + blur da una sensación translúcida consistente sobre
  // los blobs de fondo de la landing/dashboard.
  elevated: 'bg-card/60 border border-border backdrop-blur-xl',
  // Variante sin border para casos sutiles (ej. row hover de tabla).
  subtle: 'bg-card/40',
} as const;

export const HOVER = {
  border: 'hover:border-foreground/20',
  bg: 'hover:bg-accent',
  text: 'hover:text-foreground',
} as const;

// Acento monocromático por página. Cuando una página usa KpiStrip o charts
// debe pasar este accent en vez de mezclar 4 colores random en el mismo grid.
// Las páginas no listadas (ej. /leads/import) heredan el accent de su parent.
export const PAGE_ACCENT = {
  leads: 'sky',
  today: 'violet',
  pipeline: 'amber',
  projects: 'emerald',
  settings: 'blue',
  discover: 'sky',
  notifications: 'violet',
} as const;

export type AccentColor = (typeof PAGE_ACCENT)[keyof typeof PAGE_ACCENT];

// Mapeos de utility classes derivados del accent. Útil cuando un componente
// necesita aplicar texto / fondo / borde tinted sin pasar la string a Tailwind
// dinámicamente (Tailwind no resuelve interpolación arbitraria — tienen que
// estar literalmente en el código para que el purger los detecte).
export const ACCENT_TEXT: Record<AccentColor, string> = {
  sky: 'text-sky-400',
  violet: 'text-violet-400',
  amber: 'text-amber-400',
  emerald: 'text-emerald-400',
  blue: 'text-blue-400',
};

export const ACCENT_BG_SOFT: Record<AccentColor, string> = {
  sky: 'bg-sky-500/15',
  violet: 'bg-violet-500/15',
  amber: 'bg-amber-500/15',
  emerald: 'bg-emerald-500/15',
  blue: 'bg-blue-500/15',
};
