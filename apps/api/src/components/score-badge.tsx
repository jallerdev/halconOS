import { scoreTone } from '~/lib/design-tokens';
import { cn } from '~/lib/utils';

type Size = 'sm' | 'md';

// ScoreBadge — barra de progreso compacta con score numérico.
// Match exacto del handoff: track 38px (sm) / 56px (md), height 6px,
// fill animado 0.6s. Tone por threshold (75/50) desde design-tokens.
export function ScoreBadge({
  score,
  size = 'sm',
  className,
}: {
  score: number | null | undefined;
  size?: Size;
  className?: string;
}) {
  const s = Math.max(0, Math.min(100, score ?? 0));
  const tone = scoreTone(s);
  const trackW = size === 'sm' ? 'w-[38px]' : 'w-[56px]';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 font-mono text-xs font-semibold tabular-nums',
        tone.text,
        className,
      )}
      title={`Potencial de venta: ${s}/100`}
    >
      <span
        className={cn(
          'relative inline-block h-1.5 overflow-hidden rounded-full bg-[hsl(var(--score-track))]',
          trackW,
        )}
      >
        <span
          className={cn('absolute inset-y-0 left-0 rounded-full transition-[width] duration-700', tone.bg)}
          style={{ width: `${Math.max(6, s)}%` }}
        />
      </span>
      <span className="min-w-[20px]">{s}</span>
    </span>
  );
}
