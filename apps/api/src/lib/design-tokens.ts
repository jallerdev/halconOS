// Design tokens — fuente única de verdad para tratamientos de superficie y
// acentos del producto. Sistema "Atrevida": una sola marca dual violet/teal
// para TODO el dashboard. Nada de un accent por página (eso era ruido visual).
//
// Fuente de verdad de los HSL: globals.css (--violet, --teal, --card, etc).
// Si necesitas variantes de fondo / borde nuevas, AMPLIA este archivo antes
// de meter clases sueltas en componentes.

export const SURFACE = {
  // Background de página completa (transparente — debajo está el AppBg blob).
  base: 'bg-background',
  // Único nivel "elevado" — cards, top bar, sidebar, popovers persistentes.
  elevated: 'border border-border bg-card/72 backdrop-blur-xl',
  // Variante sin border, más translúcida (ej. row hover de tabla).
  subtle: 'bg-card/40',
} as const;

export const HOVER = {
  border: 'hover:border-border-strong',
  bg: 'hover:bg-accent',
  text: 'hover:text-foreground',
} as const;

// Sistema de acento. El producto entero respira violet (marca) + teal
// (datos/positivo). Las páginas YA NO eligen accent — todas heredan estos
// tokens. AccentColor queda como alias por retrocompatibilidad con el
// KpiStrip / charts que aún reciben prop `accent`; los valores son slugs
// que Tremor/Tailwind entiende.
export const BRAND = {
  violet: 'hsl(252 100% 68%)',
  teal: 'hsl(168 76% 46%)',
  gradient: 'linear-gradient(135deg, hsl(252 100% 68%), hsl(168 76% 46%))',
} as const;

export type AccentColor = 'violet' | 'teal';

// Acento por contexto: KPI strips, charts, badges. SIEMPRE pasar 'violet'
// como default — usar 'teal' sólo para señales explícitamente positivas
// (datos, conversión, dinero).
export const ACCENT_TEXT: Record<AccentColor, string> = {
  violet: 'text-[hsl(var(--violet))]',
  teal: 'text-[hsl(var(--teal))]',
};

export const ACCENT_BG_SOFT: Record<AccentColor, string> = {
  violet: 'bg-[hsl(var(--violet))]/14',
  teal: 'bg-[hsl(var(--teal))]/14',
};

// Mapeo a colores Tremor (charts). Tremor no soporta arbitrary HSL —
// hay que dar slug de su paleta.
export const TREMOR_COLOR: Record<AccentColor, string> = {
  violet: 'violet',
  teal: 'teal',
};
