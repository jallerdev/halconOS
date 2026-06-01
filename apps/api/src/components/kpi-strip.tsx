'use client';

import type { LucideIcon } from 'lucide-react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

import { type AccentColor } from '~/lib/design-tokens';
import { CountUp } from '~/components/count-up';
import { Skeleton } from '~/components/ui/skeleton';
import { Sparkline } from '~/components/sparkline';
import { cn } from '~/lib/utils';

export type KpiSpec = {
  label: string;
  value: number | string;
  // Si `value` es número, se anima con CountUp. Si es string ya formateado
  // (ej. "6,4%"), se pinta directo.
  decimals?: number;
  suffix?: string;
  icon?: LucideIcon;
  spark?: number[];
  delta?: { value: string; trend: 'up' | 'down' };
  hint?: string;
};

type Props = {
  items: KpiSpec[];
  // En "Atrevida" todas las páginas usan violet. Pasar 'teal' sólo si es
  // métrica de éxito puro (proyectos entregados, dinero ganado).
  accent?: AccentColor;
  isLoading?: boolean;
  cols?: 3 | 4;
};

// Componente único para los KPI strips del dashboard. Look "Atrevida":
// stripe gradient violet→teal arriba, ico con gradient suave, número
// display tabnum, spark inline SVG (nuestro propio Sparkline, sin libs
// externas), delta pill teal/rose.
//
// Una sola fuente de verdad para spacing, tipografía, hover, skeleton.
// NO crear "KpiCard"/"KpiStat"/"MetricCard" en paralelo: extender aquí.
export function KpiStrip({ items, accent = 'violet', isLoading, cols = 4 }: Props) {
  const colsClass =
    cols === 3
      ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
      : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4';

  const sparkTextClass = accent === 'teal' ? 'text-[hsl(var(--teal))]' : 'text-[hsl(var(--violet))]';

  if (isLoading) {
    return (
      <div className={cn('grid gap-5', colsClass)}>
        {Array.from({ length: cols }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-card/72 p-5 shadow-card backdrop-blur-xl"
          >
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-3 h-9 w-32" />
            <Skeleton className="mt-4 h-10 w-full" />
            <Skeleton className="mt-3 h-4 w-28" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('hx-stagger grid gap-5', colsClass)}>
      {items.map((item) => {
        const Ico = item.icon;
        return (
          <div
            key={item.label}
            className={cn(
              'hx-lift hx-stripe relative overflow-hidden rounded-xl border border-border p-5 shadow-card backdrop-blur-xl',
              'bg-gradient-to-br from-card/85 to-card/55',
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="truncate text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                  {item.label}
                </div>
                <div className="tabnum mt-1.5 text-3xl font-bold leading-none tracking-[-0.03em]">
                  {typeof item.value === 'number' ? (
                    <CountUp
                      value={item.value}
                      decimals={item.decimals ?? 0}
                      suffix={item.suffix ?? ''}
                    />
                  ) : (
                    item.value
                  )}
                </div>
              </div>
              {Ico && (
                <div
                  className="grid size-9 shrink-0 place-items-center rounded-[10px] text-[hsl(var(--violet))]"
                  style={{
                    background:
                      'linear-gradient(135deg, hsl(var(--violet) / 0.2), hsl(var(--teal) / 0.2))',
                  }}
                >
                  <Ico className="size-4" />
                </div>
              )}
            </div>

            {item.spark && item.spark.length > 1 ? (
              <div className={cn('mt-4 h-[38px] w-full', sparkTextClass)}>
                <Sparkline data={item.spark} height={38} strokeWidth={2} />
              </div>
            ) : (
              <div className="mt-4 h-[38px]" />
            )}

            <div className="mt-3 flex h-5 items-center gap-2">
              {item.delta ? (
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold',
                    item.delta.trend === 'up'
                      ? 'bg-[hsl(var(--teal))]/15 text-[hsl(var(--teal))]'
                      : 'bg-rose-500/15 text-rose-400',
                  )}
                >
                  {item.delta.trend === 'up' ? (
                    <ArrowUpRight className="size-3" />
                  ) : (
                    <ArrowDownRight className="size-3" />
                  )}
                  {item.delta.value}
                </span>
              ) : null}
              {item.hint && (
                <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  {item.hint}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
