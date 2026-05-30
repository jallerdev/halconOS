'use client';

import { motion } from 'framer-motion';
import { Boxes, Calendar, CheckCircle2, Clock, DollarSign, ExternalLink, Hourglass, PauseCircle, Rocket, XCircle } from 'lucide-react';
import Link from 'next/link';
import { Card as TremorCard, Metric, Text } from '@tremor/react';

import type { ProjectStatus } from '@halcon-os/shared/enums';
import { Badge } from '~/components/ui/badge';
import { Card, CardContent } from '~/components/ui/card';
import { Skeleton } from '~/components/ui/skeleton';
import { trpc } from '~/lib/trpc';

const STATUS_META: Record<ProjectStatus, { label: string; icon: typeof Boxes; tone: string; ring: string }> = {
  PLANNING: { label: 'Planeación', icon: Hourglass, tone: 'text-sky-400', ring: 'border-sky-500/30 bg-sky-500/5' },
  IN_PROGRESS: { label: 'En curso', icon: Rocket, tone: 'text-violet-400', ring: 'border-violet-500/30 bg-violet-500/5' },
  REVIEW: { label: 'Revisión', icon: Clock, tone: 'text-amber-400', ring: 'border-amber-500/30 bg-amber-500/5' },
  DELIVERED: { label: 'Entregado', icon: CheckCircle2, tone: 'text-emerald-400', ring: 'border-emerald-500/30 bg-emerald-500/5' },
  ON_HOLD: { label: 'Pausado', icon: PauseCircle, tone: 'text-zinc-400', ring: 'border-zinc-500/30 bg-zinc-500/5' },
  CANCELLED: { label: 'Cancelado', icon: XCircle, tone: 'text-rose-400', ring: 'border-rose-500/30 bg-rose-500/5' },
};

function formatCOP(value: string | number): string {
  const n = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(n)) return '—';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDate(d: Date | string | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function ProjectsPage() {
  const { data, isLoading } = trpc.projects.list.useQuery();

  const stats = data
    ? {
        total: data.length,
        active: data.filter((p) => p.status === 'IN_PROGRESS' || p.status === 'PLANNING' || p.status === 'REVIEW').length,
        delivered: data.filter((p) => p.status === 'DELIVERED').length,
        revenue: data.reduce((sum, p) => sum + Number(p.amount || 0), 0),
      }
    : null;

  return (
    <div className="mx-auto max-w-[1400px] space-y-8 px-6 py-8 lg:px-10">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Proyectos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ejecución de los leads ganados — del kickoff a la entrega.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiStat label="Total" value={stats?.total ?? 0} icon={Boxes} tone="text-foreground" isLoading={isLoading} />
        <KpiStat label="Activos" value={stats?.active ?? 0} icon={Rocket} tone="text-violet-400" isLoading={isLoading} />
        <KpiStat label="Entregados" value={stats?.delivered ?? 0} icon={CheckCircle2} tone="text-emerald-400" isLoading={isLoading} />
        <KpiStat
          label="Facturación"
          value={stats ? formatCOP(stats.revenue) : '—'}
          icon={DollarSign}
          tone="text-amber-400"
          isLoading={isLoading}
          isMoney
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : !data || data.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.map((p, i) => {
            const meta = STATUS_META[p.status as ProjectStatus];
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: i * 0.03 }}
              >
                <Card className={`group h-full overflow-hidden border transition-colors hover:border-border`}>
                  <CardContent className="space-y-4 p-5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="line-clamp-2 font-medium leading-snug">{p.name}</h3>
                      <Badge variant="outline" className={`shrink-0 ${meta.ring} ${meta.tone}`}>
                        <meta.icon className="mr-1 size-3" />
                        {meta.label}
                      </Badge>
                    </div>

                    {p.description && (
                      <p className="line-clamp-2 text-xs text-muted-foreground">{p.description}</p>
                    )}

                    <div className="flex items-center justify-between border-t border-border/60 pt-3 text-xs">
                      <div className="flex items-center gap-1.5 font-mono tabular-nums text-emerald-400">
                        <DollarSign className="size-3" />
                        {formatCOP(p.amount)}
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Calendar className="size-3" />
                        {p.deadline ? formatDate(p.deadline) : 'Sin deadline'}
                      </div>
                    </div>

                    <Link
                      href={`/leads/${p.leadId}`}
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-primary"
                    >
                      Ver lead origen <ExternalLink className="size-3" />
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function KpiStat({
  label,
  value,
  icon: Icon,
  tone,
  isLoading,
  isMoney,
}: {
  label: string;
  value: number | string;
  icon: typeof Boxes;
  tone: string;
  isLoading: boolean;
  isMoney?: boolean;
}) {
  return (
    <TremorCard className="border border-border bg-card/60 transition-colors hover:border-foreground/20">
      <div className="flex items-center justify-between">
        <Text className="text-muted-foreground">{label}</Text>
        <Icon className={`size-4 ${tone}`} />
      </div>
      {isLoading ? (
        <Skeleton className="mt-3 h-8 w-20" />
      ) : (
        <Metric className={`mt-1 ${tone} ${isMoney ? 'text-2xl' : ''}`}>{value}</Metric>
      )}
    </TremorCard>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 py-20 text-center">
      <div className="rounded-full bg-secondary/50 p-3 text-muted-foreground">
        <Boxes className="size-6" />
      </div>
      <p className="mt-4 text-sm font-medium">Aún no hay proyectos</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Cuando ganes un lead, conviértelo en proyecto desde su detalle para empezar la ejecución.
      </p>
      <Link
        href="/leads"
        className="mt-5 text-sm text-primary transition-colors hover:underline"
      >
        Ir a los leads →
      </Link>
    </div>
  );
}
