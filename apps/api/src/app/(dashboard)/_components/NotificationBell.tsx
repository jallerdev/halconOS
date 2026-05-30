'use client';

import { AlertTriangle, Bell, CalendarClock, ExternalLink, Video } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { Button } from '~/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from '~/components/ui/sheet';
import { Skeleton } from '~/components/ui/skeleton';
import { trpc } from '~/lib/trpc';

// Bell de notificaciones — v1 muestra actividad urgente derivada (meetings
// próximas + follow-ups vencidos/hoy) con un Sheet. Cuando aterrice la Fase 3
// (tabla notifications + Resend + Web Push), este componente conecta a
// trpc.notifications.list y este shell sirve como punto de entrada UI.
export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const followUps = trpc.leads.followUps.useQuery();
  const meetings = trpc.meetings.upcoming.useQuery();

  const overdue = followUps.data?.overdue ?? [];
  const today = followUps.data?.today ?? [];
  const upcoming = meetings.data ?? [];
  const totalUrgent = overdue.length + today.length + upcoming.length;

  const loading = followUps.isLoading || meetings.isLoading;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="Notificaciones"
          className="relative flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
        >
          <Bell className="size-4" />
          {totalUrgent > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold leading-4 text-white">
              {totalUrgent > 9 ? '9+' : totalUrgent}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <div className="space-y-1">
          <SheetTitle>Actividad</SheetTitle>
          <SheetDescription>
            Lo urgente de tu día: reuniones próximas y follow-ups que no pueden esperar.
          </SheetDescription>
        </div>

        <div className="mt-6 space-y-6">
          {loading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : totalUrgent === 0 ? (
            <div className="flex flex-col items-center rounded-lg border border-dashed border-border/60 py-12 text-center">
              <Bell className="size-5 text-muted-foreground" />
              <p className="mt-3 text-sm font-medium">Nada urgente por ahora</p>
              <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                Cuando tengas reuniones próximas o follow-ups vencidos aparecerán aquí.
              </p>
            </div>
          ) : (
            <>
              {upcoming.length > 0 && (
                <Section
                  icon={Video}
                  tone="text-violet-400"
                  title="Próximas reuniones"
                  count={upcoming.length}
                >
                  {upcoming.slice(0, 5).map((m) => (
                    <Row
                      key={m.id}
                      title={m.title}
                      meta={fmtMeeting(m.startsAt)}
                      href={`/leads/${m.leadId ?? ''}`}
                      onClose={() => setOpen(false)}
                    />
                  ))}
                </Section>
              )}

              {overdue.length > 0 && (
                <Section
                  icon={AlertTriangle}
                  tone="text-rose-400"
                  title="Seguimientos vencidos"
                  count={overdue.length}
                >
                  {overdue.slice(0, 5).map((l) => (
                    <Row
                      key={l.id}
                      title={l.businessName}
                      meta={l.nextFollowUpAt ? `vencido ${fmtAgo(l.nextFollowUpAt)}` : 'vencido'}
                      href={`/leads/${l.id}`}
                      onClose={() => setOpen(false)}
                    />
                  ))}
                </Section>
              )}

              {today.length > 0 && (
                <Section
                  icon={CalendarClock}
                  tone="text-amber-400"
                  title="Hoy"
                  count={today.length}
                >
                  {today.slice(0, 5).map((l) => (
                    <Row
                      key={l.id}
                      title={l.businessName}
                      meta={[l.city, l.category].filter(Boolean).join(' · ') || 'Sin categoría'}
                      href={`/leads/${l.id}`}
                      onClose={() => setOpen(false)}
                    />
                  ))}
                </Section>
              )}
            </>
          )}

          <div className="border-t border-border/60 pt-4 text-center">
            <Button variant="ghost" size="sm" asChild onClick={() => setOpen(false)}>
              <Link href="/today">Ver agenda completa</Link>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Section({
  icon: Icon,
  tone,
  title,
  count,
  children,
}: {
  icon: typeof Bell;
  tone: string;
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">
        <Icon className={`size-3.5 ${tone}`} />
        <span>{title}</span>
        <span className="rounded-full bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
          {count}
        </span>
      </div>
      <div className="space-y-1.5">{children}</div>
    </section>
  );
}

function Row({
  title,
  meta,
  href,
  onClose,
}: {
  title: string;
  meta: string;
  href: string;
  onClose: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClose}
      className="flex items-center gap-3 rounded-lg border border-border/60 bg-card/50 p-3 transition-colors hover:border-border hover:bg-card"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{title}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{meta}</p>
      </div>
      <ExternalLink className="size-3.5 shrink-0 text-muted-foreground" />
    </Link>
  );
}

function fmtMeeting(startsAt: Date | string | null): string {
  if (!startsAt) return '—';
  const d = new Date(startsAt);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  const time = d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  if (isToday) return `Hoy · ${time}`;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (d.toDateString() === tomorrow.toDateString()) return `Mañana · ${time}`;
  return `${d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })} · ${time}`;
}

function fmtAgo(date: Date | string): string {
  const d = new Date(date);
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return 'hoy';
  if (days === 1) return 'hace 1 día';
  if (days < 30) return `hace ${days} días`;
  const months = Math.floor(days / 30);
  return months === 1 ? 'hace 1 mes' : `hace ${months} meses`;
}
