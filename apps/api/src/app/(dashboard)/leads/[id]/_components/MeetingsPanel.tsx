'use client';

import { CalendarPlus, ExternalLink, Loader2, Trash2, Video } from 'lucide-react';
import { useState } from 'react';
import { toast } from '~/hooks/use-toast';

import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { ConfirmDialog } from '~/components/confirm-dialog';
import { trpc } from '~/lib/trpc';

import { ScheduleMeetingSheet } from './ScheduleMeetingSheet';

function fmtRange(starts: Date | string | null, ends: Date | string | null): string {
  if (!starts) return '—';
  const s = new Date(starts);
  const e = ends ? new Date(ends) : null;
  const date = s.toLocaleDateString('es-CO', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  const sh = s.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  const eh = e ? e.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : '';
  return `${date} · ${sh}${eh ? ` – ${eh}` : ''}`;
}

export function MeetingsPanel({
  leadId,
  businessName,
  leadEmail,
}: {
  leadId: string;
  businessName: string;
  leadEmail?: string | null;
}) {
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);
  const meetings = trpc.meetings.listByLead.useQuery({ leadId });

  const cancel = trpc.meetings.cancel.useMutation({
    onSuccess: (res) => {
      if (res.googleWarning) {
        toast.warning(`Reunión borrada localmente. ${res.googleWarning}`);
      } else {
        toast.success('Reunión cancelada');
      }
      void utils.meetings.listByLead.invalidate({ leadId });
      void utils.meetings.upcoming.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const items = meetings.data ?? [];
  const now = Date.now();
  const upcoming = items.filter((m) => m.startsAt && new Date(m.startsAt).getTime() >= now);
  const past = items.filter((m) => m.startsAt && new Date(m.startsAt).getTime() < now);

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Video className="size-4 text-[hsl(var(--violet))]" /> Reuniones
          </CardTitle>
          <Button size="sm" onClick={() => setOpen(true)}>
            <CalendarPlus /> Agendar
          </Button>
        </CardHeader>
        <CardContent>
          {meetings.isLoading ? (
            <div className="flex justify-center py-6 text-muted-foreground">
              <Loader2 className="animate-spin" />
            </div>
          ) : !items.length ? (
            <p className="py-2 text-sm text-muted-foreground">
              Aún no hay reuniones. Agenda la primera con Google Meet.
            </p>
          ) : (
            <ul className="hx-stagger space-y-2">
              {[...upcoming, ...past].map((m) => {
                const isPast = m.startsAt && new Date(m.startsAt).getTime() < now;
                return (
                  <li
                    key={m.id}
                    className="hx-lift-sm flex items-start gap-3 rounded-md border border-border bg-card-2/40 p-3 transition-colors hover:border-[hsl(var(--violet))]/45 hover:bg-[hsl(var(--violet))]/6"
                  >
                    <span className="grid size-[34px] shrink-0 place-items-center rounded-[10px] bg-[hsl(var(--violet))]/16 text-[hsl(var(--violet))]">
                      <Video className="size-[17px]" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 truncate text-[13.5px] font-semibold">
                        {m.title}
                        {isPast && (
                          <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                            Pasada
                          </span>
                        )}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {fmtRange(m.startsAt, m.endsAt)}
                      </p>
                      {m.attendees.length > 0 && (
                        <p className="mt-1 truncate text-xs text-muted-foreground">
                          Con: {m.attendees.join(', ')}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-1">
                      {m.meetUrl && (
                        <Button variant="outline" size="icon" asChild title="Abrir Meet">
                          <a href={m.meetUrl} target="_blank" rel="noreferrer">
                            <ExternalLink />
                          </a>
                        </Button>
                      )}
                      {!isPast && (
                        <ConfirmDialog
                          title="¿Cancelar esta reunión?"
                          description="Se borrará el evento del calendario de Google y se notificará a los asistentes."
                          confirmLabel="Cancelar reunión"
                          destructive
                          disabled={cancel.isPending}
                          onConfirm={() => cancel.mutate({ id: m.id })}
                          trigger={
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-muted-foreground hover:text-rose-400"
                              disabled={cancel.isPending}
                              title="Cancelar"
                            >
                              <Trash2 />
                            </Button>
                          }
                        />
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <ScheduleMeetingSheet
        open={open}
        onOpenChange={setOpen}
        leadId={leadId}
        businessName={businessName}
        leadEmail={leadEmail}
      />
    </>
  );
}
