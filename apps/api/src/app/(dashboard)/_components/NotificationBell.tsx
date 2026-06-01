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
import { cn } from '~/lib/utils';

// Bell + drawer "Actividad" — diseño Atrevida (design_handoff_halcon).
// Muestra meetings próximas + follow-ups urgentes hoy. Cuando aterrice la
// Fase 3 (tabla notifications + Resend + Web Push), agregar una sección
// "Nuevas" arriba con accent teal usando el mismo <ActSection /> + <ActItem>.
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
          className="hx-press relative inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <Bell className="size-[18px]" />
          {totalUrgent > 0 && (
            // key={totalUrgent} fuerza remount → reproduce la animación cada
            // vez que sube el contador (pop). Glow violet/teal en el badge
            // para que se note dentro del topbar oscuro.
            <span
              key={totalUrgent}
              className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] animate-in zoom-in-50 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-card"
              style={{ animationDuration: '180ms' }}
            >
              {totalUrgent > 9 ? '9+' : totalUrgent}
            </span>
          )}
        </button>
      </SheetTrigger>

      <SheetContent
        side="right"
        // Borde izquierdo con stripe gradient violet→teal (firma Atrevida).
        className="w-full overflow-hidden border-l border-border bg-card/96 p-0 shadow-pop backdrop-blur-2xl sm:max-w-[420px]"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 w-[2px] opacity-90"
          style={{
            background: 'linear-gradient(180deg, hsl(var(--violet)), hsl(var(--teal)))',
          }}
        />

        <div className="flex h-full flex-col">
          {/* Head */}
          <div className="border-b border-border px-[22px] pb-[18px] pt-[22px]">
            <SheetTitle className="text-[20px] font-bold tracking-[-0.02em]">
              Actividad
            </SheetTitle>
            <SheetDescription className="mt-1.5 text-[12.5px] leading-[1.5]">
              Lo urgente de tu día — reuniones próximas y follow-ups que no pueden esperar.
            </SheetDescription>
          </div>

          {/* Body */}
          <div className="flex flex-1 flex-col gap-[22px] overflow-y-auto px-4 py-[18px]">
            {loading ? (
              <div className="space-y-2">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-[60px] w-full rounded-lg" />
                ))}
              </div>
            ) : totalUrgent === 0 ? (
              <EmptyState />
            ) : (
              <>
                {upcoming.length > 0 && (
                  <ActSection
                    icon={Video}
                    color="violet"
                    title="Próximas reuniones"
                    count={upcoming.length}
                  >
                    {upcoming.slice(0, 5).map((m) => (
                      <MeetingItem
                        key={m.id}
                        title={m.title}
                        when={fmtMeeting(m.startsAt)}
                        href={`/leads/${m.leadId ?? ''}`}
                        onClose={() => setOpen(false)}
                      />
                    ))}
                  </ActSection>
                )}

                {overdue.length > 0 && (
                  <ActSection
                    icon={AlertTriangle}
                    color="rose"
                    title="Vencidos"
                    count={overdue.length}
                  >
                    {overdue.slice(0, 5).map((l) => (
                      <FollowUpItem
                        key={l.id}
                        title={l.businessName}
                        meta={l.nextFollowUpAt ? `vencido ${fmtAgo(l.nextFollowUpAt)}` : 'vencido'}
                        href={`/leads/${l.id}`}
                        tone="rose"
                        onClose={() => setOpen(false)}
                      />
                    ))}
                  </ActSection>
                )}

                {today.length > 0 && (
                  <ActSection
                    icon={CalendarClock}
                    color="amber"
                    title="Hoy"
                    count={today.length}
                  >
                    {today.slice(0, 5).map((l) => (
                      <FollowUpItem
                        key={l.id}
                        title={l.businessName}
                        meta={
                          [l.city, l.category].filter(Boolean).join(' · ') ||
                          'Sin categoría'
                        }
                        href={`/leads/${l.id}`}
                        tone="amber"
                        onClose={() => setOpen(false)}
                      />
                    ))}
                  </ActSection>
                )}
              </>
            )}
          </div>

          {/* Foot */}
          <div className="border-t border-border px-[18px] py-4">
            <Button
              variant="outline"
              className="w-full"
              asChild
              onClick={() => setOpen(false)}
            >
              <Link href="/today">
                Ver agenda completa
                <ExternalLink className="size-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─────────────────────── Section ───────────────────────

const SEC_COLOR: Record<SectionColor, string> = {
  violet: 'text-[hsl(var(--violet))]',
  teal: 'text-[hsl(var(--teal))]',
  rose: 'text-rose-400',
  amber: 'text-amber-400',
};

type SectionColor = 'violet' | 'teal' | 'rose' | 'amber';

function ActSection({
  icon: Icon,
  color,
  title,
  count,
  children,
}: {
  icon: typeof Bell;
  color: SectionColor;
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2.5">
      <div
        className={cn(
          'flex items-center gap-2 px-1.5 text-[11px] font-bold uppercase tracking-[0.1em]',
          SEC_COLOR[color],
        )}
      >
        <Icon className="size-[15px]" />
        <span>{title}</span>
        <span className="inline-grid h-[18px] min-w-[18px] place-items-center rounded-full bg-muted px-1.5 text-[10px] font-bold tracking-normal text-muted-foreground">
          {count}
        </span>
      </div>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

// ─────────────────────── Items ───────────────────────

function MeetingItem({
  title,
  when,
  href,
  onClose,
}: {
  title: string;
  when: string;
  href: string;
  onClose: () => void;
}) {
  return (
    <Link href={href} onClick={onClose} className="act-item group">
      <span className="grid size-[34px] shrink-0 place-items-center rounded-[10px] bg-[hsl(var(--violet))]/16 text-[hsl(var(--violet))]">
        <Video className="size-[17px]" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
        <span className="truncate text-[13.5px] font-semibold">{title}</span>
        <span className="flex items-center gap-1 truncate text-xs text-muted-foreground">
          <CalendarClock className="size-3" />
          {when}
        </span>
      </span>
      <ExternalLink className="act-go size-[15px] shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </Link>
  );
}

function FollowUpItem({
  title,
  meta,
  href,
  tone,
  onClose,
}: {
  title: string;
  meta: string;
  href: string;
  tone: 'rose' | 'amber';
  onClose: () => void;
}) {
  const markBg =
    tone === 'rose'
      ? 'bg-rose-500/16 text-rose-400'
      : 'bg-amber-500/16 text-amber-400';
  return (
    <Link href={href} onClick={onClose} className="act-item group">
      <span className={cn('grid size-[34px] shrink-0 place-items-center rounded-[10px]', markBg)}>
        <AlertTriangle className="size-[17px]" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
        <span className="truncate text-[13.5px] font-semibold">{title}</span>
        <span className="truncate text-xs text-muted-foreground">{meta}</span>
      </span>
      <ExternalLink className="act-go size-[15px] shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </Link>
  );
}

// ─────────────────────── Empty ───────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-12 text-center">
      <span
        className="grid size-11 place-items-center rounded-[13px] text-[hsl(var(--violet))]"
        style={{
          background:
            'linear-gradient(135deg, hsl(var(--violet) / 0.18), hsl(var(--teal) / 0.18))',
        }}
      >
        <Bell className="size-5" />
      </span>
      <p className="mt-3.5 text-sm font-semibold">Nada urgente por ahora</p>
      <p className="mt-1 max-w-xs text-xs text-muted-foreground">
        Cuando tengas reuniones próximas o follow-ups vencidos, aparecerán aquí.
      </p>
    </div>
  );
}

// ─────────────────────── Formatters ───────────────────────

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
