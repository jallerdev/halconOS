'use client';

import { AlertTriangle, CalendarClock, CalendarDays, Star } from 'lucide-react';
import Link from 'next/link';
import { toast } from '~/hooks/use-toast';

import type { inferRouterOutputs } from '@trpc/server';

import type { AppRouter } from '~/server/routers/_app';
import { BusinessAvatar } from '~/components/business-avatar';
import { KpiStrip, type KpiSpec } from '~/components/kpi-strip';
import { LeadStatusBadge } from '~/components/lead-status-badge';
import { PageHeader } from '~/components/page-header';
import { ScoreBadge } from '~/components/score-badge';
import { WhatsAppButton } from '~/components/whatsapp-button';
import { Button } from '~/components/ui/button';
import { Skeleton } from '~/components/ui/skeleton';
import { trpc } from '~/lib/trpc';

import { UpcomingMeetings } from './_components/UpcomingMeetings';

export default function TodayPage() {
  const { data, isLoading } = trpc.leads.followUps.useQuery();

  const items: KpiSpec[] = data
    ? [
        {
          label: 'Vencidos',
          value: data.counts.overdue,
          icon: AlertTriangle,
          hint: data.counts.overdue === 0 ? 'todo al día' : 'sin contactar',
        },
        {
          label: 'Hoy',
          value: data.counts.today,
          icon: CalendarDays,
          hint: 'programados para hoy',
        },
        {
          label: 'Próximos',
          value: data.counts.upcoming,
          icon: CalendarClock,
          hint: 'siguientes 7 días',
        },
      ]
    : [];

  return (
    <div className="hx-page mx-auto max-w-[1100px] space-y-8 px-6 py-8 lg:px-10">
      <PageHeader
        eyebrow="Esta semana"
        title="Hoy"
        description="Seguimientos programados de tus leads."
      />

      <KpiStrip items={items} accent="violet" isLoading={isLoading} cols={3} />

      <UpcomingMeetings />

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : !data || data.counts.overdue + data.counts.today + data.counts.upcoming === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 py-20 text-center">
          <CalendarClock className="size-6 text-muted-foreground" />
          <p className="mt-4 text-sm font-medium">No tienes seguimientos programados</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Programa un seguimiento desde el panel de un lead.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          <Bucket
            title="Vencidos"
            icon={AlertTriangle}
            tone="text-rose-400"
            items={data.overdue}
            empty="Nada vencido. 👌"
          />
          <Bucket
            title="Hoy"
            icon={CalendarDays}
            tone="text-amber-400"
            items={data.today}
            empty="Nada para hoy."
          />
          <Bucket
            title="Próximos"
            icon={CalendarClock}
            tone="text-sky-400"
            items={data.upcoming}
            empty="Sin próximos."
          />
        </div>
      )}
    </div>
  );
}

type Item = inferRouterOutputs<AppRouter>['leads']['followUps']['today'][number];

function Bucket({
  title,
  icon: Icon,
  tone,
  items,
  empty,
}: {
  title: string;
  icon: import('lucide-react').LucideIcon;
  tone: string;
  items: Item[];
  empty: string;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <Icon className={`size-[15px] ${tone}`} />
        <h2 className="text-[11px] font-bold uppercase tracking-[0.1em]">{title}</h2>
        <span className="inline-grid h-[18px] min-w-[18px] place-items-center rounded-full bg-muted px-1.5 text-[10px] font-bold text-muted-foreground">
          {items.length}
        </span>
      </div>
      {items.length === 0 ? (
        <p className="px-1 text-sm text-muted-foreground">{empty}</p>
      ) : (
        <div className="hx-stagger space-y-2">
          {items.map((l) => (
            <Row key={l.id} lead={l} />
          ))}
        </div>
      )}
    </section>
  );
}

function Row({ lead }: { lead: Item }) {
  const utils = trpc.useUtils();
  const clearFollowUp = trpc.leads.setFollowUp.useMutation({
    onSuccess: () => {
      utils.leads.followUps.invalidate();
      toast.success('Seguimiento completado');
    },
  });
  const snooze = trpc.leads.setFollowUp.useMutation({
    onSuccess: () => {
      utils.leads.followUps.invalidate();
      toast.success('Pospuesto 3 días');
    },
  });

  const due = lead.nextFollowUpAt ? new Date(lead.nextFollowUpAt) : null;

  return (
    <div className="hx-lift-sm flex items-center gap-3 rounded-md border border-border bg-card-2/50 p-3 transition-colors hover:border-[hsl(var(--violet))]/45 hover:bg-[hsl(var(--violet))]/6">
      <BusinessAvatar name={lead.businessName} size="md" />
      <div className="min-w-0 flex-1">
        <Link
          href={`/leads/${lead.id}`}
          className="truncate text-[13.5px] font-semibold hover:text-[hsl(var(--violet))]"
        >
          {lead.businessName}
        </Link>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
          {[lead.category, lead.city].filter(Boolean).join(' · ')}
          {due && <span>· {due.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}</span>}
        </div>
      </div>
      <ScoreBadge score={lead.score} />
      <LeadStatusBadge status={lead.status} />
      {lead.googleRating && (
        <span className="hidden items-center gap-1 font-mono text-xs text-muted-foreground sm:inline-flex">
          <Star className="size-3 fill-amber-400 text-amber-400" />
          {lead.googleRating}
        </span>
      )}
      <WhatsAppButton
        leadId={lead.id}
        phone={lead.phone}
        phoneIntl={lead.phoneIntl}
        aiFirstMessage={lead.aiFirstMessage}
        businessName={lead.businessName}
        size="icon"
        label=""
      />
      <Button
        size="sm"
        variant="ghost"
        onClick={() => {
          const d = new Date();
          d.setDate(d.getDate() + 3);
          snooze.mutate({ id: lead.id, date: d.toISOString() });
        }}
      >
        +3d
      </Button>
      <Button size="sm" variant="ghost" onClick={() => clearFollowUp.mutate({ id: lead.id, date: null })}>
        ✓
      </Button>
    </div>
  );
}
