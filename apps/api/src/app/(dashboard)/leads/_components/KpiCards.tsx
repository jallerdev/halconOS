'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, PhoneCall, TrendingUp, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  BadgeDelta,
  Card as TremorCard,
  Metric,
  SparkAreaChart,
  Text,
  type DeltaType,
} from '@tremor/react';

import { Skeleton } from '~/components/ui/skeleton';
import { trpc } from '~/lib/trpc';

// Tremor uniforme: 4 cards con label · metric · BadgeDelta · sparkline.
// Cada KPI tiene su propia curva de 14 días para que la tarjeta cuente una
// historia (no solo un número).
type KpiSpec = {
  label: string;
  value: string;
  icon: LucideIcon;
  iconTone: string;
  spark: number[];
  sparkColor: 'sky' | 'violet' | 'blue' | 'emerald';
  delta?: { value: string; type: DeltaType };
};

function deltaType(pct: number): DeltaType {
  if (pct > 2) return 'increase';
  if (pct < -2) return 'decrease';
  return 'unchanged';
}

function formatPct(pct: number): string {
  if (pct === 0) return 'sin cambio';
  const sign = pct > 0 ? '+' : '';
  return `${sign}${pct}% sem`;
}

function formatNumber(n: number): string {
  return n.toLocaleString('es-CO');
}

export function KpiCards() {
  const { data, isLoading } = trpc.leads.stats.useQuery();

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <TremorCard key={i} className="border border-border bg-card/60">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-3 h-8 w-20" />
            <Skeleton className="mt-4 h-10 w-full" />
            <Skeleton className="mt-2 h-3 w-32" />
          </TremorCard>
        ))}
      </div>
    );
  }

  const cards: KpiSpec[] = [
    {
      label: 'Total de leads',
      value: formatNumber(data.total),
      icon: Users,
      iconTone: 'text-sky-400',
      spark: data.totalSparkline,
      sparkColor: 'sky',
    },
    {
      label: 'Nuevos · semana',
      value: formatNumber(data.nuevosSemana),
      icon: TrendingUp,
      iconTone: 'text-violet-400',
      spark: data.nuevosSparkline,
      sparkColor: 'violet',
      delta: { value: formatPct(data.trendNuevos), type: deltaType(data.trendNuevos) },
    },
    {
      label: 'Contactados',
      value: formatNumber(data.contactados),
      icon: PhoneCall,
      iconTone: 'text-blue-400',
      spark: data.contactadosSparkline,
      sparkColor: 'blue',
      delta: {
        value: formatPct(data.trendContactados),
        type: deltaType(data.trendContactados),
      },
    },
    {
      label: 'Tasa de conversión',
      value: `${data.conversion.toLocaleString('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`,
      icon: CheckCircle2,
      iconTone: 'text-emerald-400',
      spark: data.ganadosSparkline,
      sparkColor: 'emerald',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((c, i) => (
        <motion.div
          key={c.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
        >
          <TremorCard className="group relative overflow-hidden border border-border bg-card/60 transition-colors hover:border-foreground/20">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <Text className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {c.label}
                </Text>
                <Metric className="tabular-nums">{c.value}</Metric>
              </div>
              <div className={`rounded-lg bg-secondary/60 p-2 ${c.iconTone}`}>
                <c.icon className="size-4" />
              </div>
            </div>

            <SparkAreaChart
              data={c.spark.map((n, idx) => ({ idx, value: n }))}
              index="idx"
              categories={['value']}
              colors={[c.sparkColor]}
              className="mt-4 h-10 w-full"
            />

            <div className="mt-3 flex h-5 items-center">
              {c.delta ? (
                <BadgeDelta deltaType={c.delta.type} className="text-[10px]">
                  {c.delta.value}
                </BadgeDelta>
              ) : (
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  últimos 14 días
                </span>
              )}
            </div>
          </TremorCard>
        </motion.div>
      ))}
    </div>
  );
}
