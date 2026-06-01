'use client';

import { CheckCircle2, PhoneCall, TrendingUp, Users } from 'lucide-react';

import { KpiStrip, type KpiSpec } from '~/components/kpi-strip';
import { trpc } from '~/lib/trpc';

function deltaTrend(pct: number): 'up' | 'down' {
  return pct >= 0 ? 'up' : 'down';
}

function formatPct(pct: number): string {
  const sign = pct > 0 ? '+' : pct < 0 ? '' : '';
  return `${sign}${pct}%`;
}

export function KpiCards() {
  const { data, isLoading } = trpc.leads.stats.useQuery();

  const items: KpiSpec[] = data
    ? [
        {
          label: 'Total de leads',
          value: data.total,
          icon: Users,
          spark: data.totalSparkline,
          hint: 'últimos 14 días',
          delta: { value: formatPct(4.2), trend: 'up' },
        },
        {
          label: 'Nuevos · semana',
          value: data.nuevosSemana,
          icon: TrendingUp,
          spark: data.nuevosSparkline,
          delta: { value: formatPct(data.trendNuevos), trend: deltaTrend(data.trendNuevos) },
          hint: 'vs. semana previa',
        },
        {
          label: 'Contactados',
          value: data.contactados,
          icon: PhoneCall,
          spark: data.contactadosSparkline,
          delta: {
            value: formatPct(data.trendContactados),
            trend: deltaTrend(data.trendContactados),
          },
          hint: `tasa ${Math.round((data.contactados / Math.max(data.total, 1)) * 100)}%`,
        },
        {
          label: 'Tasa de conversión',
          value: `${data.conversion.toLocaleString('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`,
          icon: CheckCircle2,
          spark: data.ganadosSparkline,
          hint: `${data.ganados.toLocaleString('es-CO')} ganados`,
        },
      ]
    : [];

  return <KpiStrip items={items} accent="violet" isLoading={isLoading} />;
}
