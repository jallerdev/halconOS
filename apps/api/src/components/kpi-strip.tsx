'use client';

import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import {
  BadgeDelta,
  Card as TremorCard,
  Metric,
  SparkAreaChart,
  Text,
  type DeltaType,
} from '@tremor/react';

import { ACCENT_BG_SOFT, ACCENT_TEXT, type AccentColor } from '~/lib/design-tokens';
import { Skeleton } from '~/components/ui/skeleton';
import { cn } from '~/lib/utils';

export type KpiSpec = {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  spark?: number[];
  delta?: { value: string; type: DeltaType };
  hint?: string;
};

type Props = {
  items: KpiSpec[];
  accent: AccentColor;
  isLoading?: boolean;
  // Cuántas columnas mostrar en xl. Por defecto 4 (4 KPIs). Pasarle 3 si
  // la página solo tiene 3 KPIs (ej. /today).
  cols?: 3 | 4;
};

// Componente único para los KPI strips del dashboard. Una sola fuente de
// verdad para spacing, tipografía, tratamiento de spark, badge de delta y
// loading skeleton. NO crear "KpiCard" / "KpiStat" / "MetricCard" a la par;
// pasar siempre por aquí.
export function KpiStrip({ items, accent, isLoading, cols = 4 }: Props) {
  const colsClass =
    cols === 3
      ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
      : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4';

  if (isLoading) {
    return (
      <div className={cn('grid gap-4', colsClass)}>
        {Array.from({ length: cols }).map((_, i) => (
          <TremorCard key={i} className="border border-border bg-card/60">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-3 h-8 w-24" />
            <Skeleton className="mt-4 h-10 w-full" />
            <Skeleton className="mt-3 h-4 w-28" />
          </TremorCard>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('grid gap-4', colsClass)}>
      {items.map((item, i) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
        >
          <TremorCard className="group border border-border bg-card/60 transition-colors hover:border-foreground/20">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <Text className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {item.label}
                </Text>
                <Metric className="tabular-nums">{item.value}</Metric>
              </div>
              {item.icon && (
                <div className={cn('rounded-lg p-2', ACCENT_BG_SOFT[accent], ACCENT_TEXT[accent])}>
                  <item.icon className="size-4" />
                </div>
              )}
            </div>

            {item.spark && item.spark.length > 1 ? (
              <SparkAreaChart
                data={item.spark.map((n, idx) => ({ idx, value: n }))}
                index="idx"
                categories={['value']}
                colors={[accent]}
                className="mt-4 h-10 w-full"
              />
            ) : (
              <div className="mt-4 h-10" />
            )}

            <div className="mt-3 flex h-5 items-center">
              {item.delta ? (
                <BadgeDelta deltaType={item.delta.type} className="text-[10px]">
                  {item.delta.value}
                </BadgeDelta>
              ) : item.hint ? (
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {item.hint}
                </span>
              ) : null}
            </div>
          </TremorCard>
        </motion.div>
      ))}
    </div>
  );
}
