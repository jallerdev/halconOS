'use client';

import { motion } from 'framer-motion';
import { ArrowDownRight, ArrowUpRight, CheckCircle2, PhoneCall, TrendingUp, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { CountUp } from '~/components/count-up';
import { Sparkline } from '~/components/sparkline';
import { Card } from '~/components/ui/card';
import { cn } from '~/lib/utils';
import { trpc } from '~/lib/trpc';

export function KpiCards() {
  const { data, isLoading } = trpc.leads.stats.useQuery();

  const cards: {
    label: string;
    value: number;
    suffix?: string;
    decimals?: number;
    icon: LucideIcon;
    trend?: number;
    sub?: string;
    accent: string;
    showSpark?: boolean;
  }[] = [
    {
      label: 'Total de Leads',
      value: data?.total ?? 0,
      icon: Users,
      sub: 'negocios sin web',
      accent: 'text-sky-300',
    },
    {
      label: 'Nuevos esta semana',
      value: data?.nuevosSemana ?? 0,
      icon: TrendingUp,
      trend: data?.trendNuevos,
      accent: 'text-violet-300',
      showSpark: true,
    },
    {
      label: 'Contactados',
      value: data?.contactados ?? 0,
      icon: PhoneCall,
      sub: 'en seguimiento',
      accent: 'text-blue-300',
    },
    {
      label: 'Tasa de conversión',
      value: data?.conversion ?? 0,
      suffix: '%',
      decimals: 1,
      icon: CheckCircle2,
      sub: `${(data?.ganados ?? 0).toLocaleString('es-CO')} ganados`,
      accent: 'text-emerald-300',
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
          <Card className="group relative overflow-hidden p-5 transition-colors hover:border-border">
            {/* glow sutil */}
            <div
              className={cn(
                'pointer-events-none absolute -right-8 -top-8 size-24 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-20',
                c.accent.replace('text-', 'bg-'),
              )}
            />
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {c.label}
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">
                  {isLoading ? (
                    <span className="inline-block h-7 w-16 animate-pulse rounded bg-secondary/60" />
                  ) : (
                    <CountUp value={c.value} suffix={c.suffix} decimals={c.decimals ?? 0} />
                  )}
                </p>
              </div>
              <div className={cn('rounded-lg bg-secondary/60 p-2', c.accent)}>
                <c.icon className="size-4" />
              </div>
            </div>
            <div className="mt-3 flex h-7 items-center justify-between">
              <div className="text-xs text-muted-foreground">
                {c.trend != null ? (
                  <span
                    className={cn(
                      'inline-flex items-center gap-0.5 font-medium',
                      c.trend >= 0 ? 'text-emerald-400' : 'text-rose-400',
                    )}
                  >
                    {c.trend >= 0 ? (
                      <ArrowUpRight className="size-3" />
                    ) : (
                      <ArrowDownRight className="size-3" />
                    )}
                    {Math.abs(c.trend)}% vs. semana previa
                  </span>
                ) : (
                  <span>{c.sub}</span>
                )}
              </div>
              {c.showSpark && data?.sparkline && data.sparkline.length > 1 && (
                <Sparkline data={data.sparkline} className={c.accent} />
              )}
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
