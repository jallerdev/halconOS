import { cn } from '~/lib/utils';

type Size = 'sm' | 'md' | 'lg';

// BusinessAvatar «Atrevida» — DOS TONOS (violet / teal), elegidos de forma
// estable por el nombre. Sin paleta de 8 colores: el producto vive en
// violet+teal. Mismo nombre → mismo tono siempre.
const TONES = [
  { bg: 'bg-primary/15', fg: 'text-primary' },
  { bg: 'bg-teal-500/15', fg: 'text-teal-600 dark:text-teal-300' },
];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function initials(name: string): string {
  const parts = name
    .replace(/[·\-/]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
}

const SIZE: Record<Size, string> = {
  sm: 'size-7 rounded-[7px] text-[10px]',
  md: 'size-[30px] rounded-[9px] text-[11px]',
  lg: 'size-[56px] rounded-[13px] text-base',
};

export function BusinessAvatar({
  name,
  size = 'md',
  className,
}: {
  name: string;
  size?: Size;
  className?: string;
}) {
  const tone = TONES[hash(name) % TONES.length]!;
  return (
    <span
      className={cn(
        'inline-grid shrink-0 place-items-center font-bold tracking-[0.01em]',
        SIZE[size],
        tone.bg,
        tone.fg,
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
