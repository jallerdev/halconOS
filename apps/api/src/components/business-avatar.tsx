import { AVATAR_PALETTE } from '~/lib/design-tokens';
import { cn } from '~/lib/utils';

type Size = 'sm' | 'md' | 'lg';

// Hash deterministico (sumatoria * 31) — mismo que el handoff. Mismo nombre
// → mismo color siempre, sin importar de dónde se renderice.
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

// BusinessAvatar — iniciales con color deterministico por hash(name).
// Match del handoff: 8 colores rotatorios desde AVATAR_PALETTE,
// rounded-[9px] (md), font-bold 650.
export function BusinessAvatar({
  name,
  size = 'md',
  className,
}: {
  name: string;
  size?: Size;
  className?: string;
}) {
  const tone = AVATAR_PALETTE[hash(name) % AVATAR_PALETTE.length]!;
  return (
    <span
      className={cn(
        'inline-grid shrink-0 place-items-center font-bold tracking-[0.01em]',
        SIZE[size],
        tone.bg,
        tone.text,
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
