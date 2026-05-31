'use client';

import { CheckCircle2, PhoneCall, TrendingUp, Users } from 'lucide-react';
import type { DeltaType } from '@tremor/react';

import { KpiStrip, type KpiSpec } from '~/components/kpi-strip';
import { trpc } from '~/lib/trpc';

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

  const items: KpiSpec[] = data
    ? [
        {
          label: 'Total de leads',
          value: formatNumber(data.total),
          icon: Users,
          spark: data.totalSparkline,
          hint: 'últimos 14 días',
        },
        {
          label: 'Nuevos · semana',
          value: formatNumber(data.nuevosSemana),
          icon: TrendingUp,
          spark: data.nuevosSparkline,
          delta: { value: formatPct(data.trendNuevos), type: deltaType(data.trendNuevos) },
        },
        {
          label: 'Contactados',
          value: formatNumber(data.contactados),
          icon: PhoneCall,
          spark: data.contactadosSparkline,
          delta: {
            value: formatPct(data.trendContactados),
            type: deltaType(data.trendContactados),
          },
        },
        {
          label: 'Tasa de conversión',
          value: `${data.conversion.toLocaleString('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`,
          icon: CheckCircle2,
          spark: data.ganadosSparkline,
          hint: `${formatNumber(data.ganados)} ganados`,
        },
      ]
    : [];

  return <KpiStrip items={items} accent="sky" isLoading={isLoading} />;
}
