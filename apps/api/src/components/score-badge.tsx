import { cn } from '~/lib/utils';

export function ScoreBadge({ score, className }: { score: number | null | undefined; className?: string }) {
  const s = score ?? 0;
  const tone =
    s >= 75
      ? 'text-emerald-300 ring-emerald-500/30 bg-emerald-500/10'
      : s >= 50
        ? 'text-amber-300 ring-amber-500/30 bg-amber-500/10'
        : 'text-zinc-400 ring-zinc-500/20 bg-zinc-500/10';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 font-mono text-xs ring-1 ring-inset',
        tone,
        className,
      )}
      title={`Potencial de venta: ${s}/100`}
    >
      <span className="relative flex h-1.5 w-8 overflow-hidden rounded-full bg-current/20">
        <span
          className="absolute inset-y-0 left-0 rounded-full bg-current"
          style={{ width: `${Math.min(100, Math.max(4, s))}%` }}
        />
      </span>
      {s}
    </span>
  );
}
