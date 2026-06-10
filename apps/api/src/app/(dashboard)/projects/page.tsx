'use client';

import { motion } from 'framer-motion';
import {
  Boxes,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  ExternalLink,
  Hourglass,
  PauseCircle,
  Rocket,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';

import type { ProjectStatus } from '@halcon-os/shared/enums';
import { KpiStrip, type KpiSpec } from '~/components/kpi-strip';
import { PageHeader } from '~/components/page-header';
import { Badge } from '~/components/ui/badge';
import { Card, CardContent } from '~/components/ui/card';
import { Skeleton } from '~/components/ui/skeleton';
import { PROJECT_STATUS_HUE } from '~/lib/design-tokens';
import { trpc } from '~/lib/trpc';
import { useScrollRestore } from '~/hooks/use-scroll-restore';

const STATUS_META: Record<
  ProjectStatus,
  { label: string; icon: typeof Boxes }
> = {
  PLANNING: { label: 'Planeación', icon: Hourglass },
  IN_PROGRESS: { label: 'En curso', icon: Rocket },
  REVIEW: { label: 'Revisión', icon: Clock },
  DELIVERED: { label: 'Entregado', icon: CheckCircle2 },
  ON_HOLD: { label: 'Pausado', icon: PauseCircle },
  CANCELLED: { label: 'Cancelado', icon: XCircle },
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
  useScrollRestore('projects', !!data);

  const stats = data
    ? {
        total: data.length,
        active: data.filter(
          (p) =>
            p.status === 'IN_PROGRESS' || p.status === 'PLANNING' || p.status === 'REVIEW',
        ).length,
        delivered: data.filter((p) => p.status === 'DELIVERED').length,
        revenue: data.reduce((sum, p) => sum + Number(p.amount || 0), 0),
      }
    : null;

  const items: KpiSpec[] = stats
    ? [
        { label: 'Total', value: stats.total, icon: Boxes, hint: 'proyectos creados' },
        { label: 'Activos', value: stats.active, icon: Rocket, hint: 'en ejecución' },
        { label: 'Entregados', value: stats.delivered, icon: CheckCircle2, hint: 'cerrados' },
        {
          label: 'Facturación',
          value: formatCOP(stats.revenue),
          icon: DollarSign,
          hint: 'monto total acumulado',
        },
      ]
    : [];

  return (
    <div className="hx-page mx-auto max-w-[1480px] space-y-8 px-6 py-8 lg:px-10">
      <PageHeader
        eyebrow="Ejecución"
        title="Proyectos"
        description="Ejecución de los leads ganados — del kickoff a la entrega."
      />

      <KpiStrip items={items} accent="teal" isLoading={isLoading} />

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
            const hue = PROJECT_STATUS_HUE[p.status as ProjectStatus];
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: i * 0.03 }}
              >
                <Card className="hx-lift hx-stripe group relative h-full overflow-hidden bg-gradient-to-br from-card/88 to-card/72">
                  <CardContent className="space-y-4 px-[22px] pb-5 pt-5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="line-clamp-2 font-semibold leading-snug tracking-[-0.01em]">{p.name}</h3>
                      <Badge variant="outline" className={`shrink-0 ${hue.border} ${hue.bg} ${hue.text}`}>
                        <meta.icon className="mr-1 size-3" />
                        {meta.label}
                      </Badge>
                    </div>

                    {p.description && (
                      <p className="line-clamp-2 text-xs text-muted-foreground">{p.description}</p>
                    )}

                    <div className="flex items-center justify-between border-t border-border pt-3 text-xs">
                      <div className="flex items-center gap-1.5 font-mono tabular-nums text-[hsl(var(--teal))]">
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
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-[hsl(var(--violet))]"
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

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
      <div
        className="grid size-12 place-items-center rounded-[13px] text-[hsl(var(--violet))]"
        style={{
          background: 'linear-gradient(135deg, hsl(var(--violet) / 0.18), hsl(var(--teal) / 0.18))',
        }}
      >
        <Boxes className="size-6" />
      </div>
      <p className="mt-4 text-sm font-semibold">Aún no hay proyectos</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Cuando ganes un lead, conviértelo en proyecto desde su detalle para empezar la ejecución.
      </p>
      <Link
        href="/leads"
        className="mt-5 text-sm text-[hsl(var(--violet))] transition-colors hover:underline"
      >
        Ir a los leads →
      </Link>
    </div>
  );
}
