'use client';

import { ExternalLink, Loader2, Video } from 'lucide-react';
import Link from 'next/link';

import { Button } from '~/components/ui/button';
import { trpc } from '~/lib/trpc';

function fmtWhen(starts: Date | string | null): string {
  if (!starts) return '—';
  const s = new Date(starts);
  const now = new Date();
  const sameDay = s.toDateString() === now.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const isTomorrow = s.toDateString() === tomorrow.toDateString();
  const time = s.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  if (sameDay) return `Hoy · ${time}`;
  if (isTomorrow) return `Mañana · ${time}`;
  const day = s.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' });
  return `${day} · ${time}`;
}

export function UpcomingMeetings() {
  const { data, isLoading } = trpc.meetings.upcoming.useQuery({ limit: 10 });

  if (isLoading) {
    return (
      <div className="flex justify-center py-6 text-muted-foreground">
        <Loader2 className="animate-spin" />
      </div>
    );
  }
  if (!data || data.length === 0) return null;

  return (
    <section>
      <header className="mb-3 flex items-center gap-2">
        <Video className="size-4 text-[hsl(var(--violet))]" />
        <h2 className="text-[11px] font-bold uppercase tracking-[0.1em] text-foreground">
          Próximas reuniones
        </h2>
        <span className="inline-grid h-[18px] min-w-[18px] place-items-center rounded-full bg-muted px-1.5 text-[10px] font-bold text-muted-foreground">
          {data.length}
        </span>
      </header>

      <ul className="hx-stagger flex flex-col gap-2">
        {data.map((m) => (
          <li
            key={m.id}
            className="hx-lift-sm flex items-center gap-3 rounded-md border border-border bg-card-2/50 p-3 transition-colors hover:border-[hsl(var(--violet))]/45 hover:bg-[hsl(var(--violet))]/6"
          >
            <span className="grid size-[34px] shrink-0 place-items-center rounded-[10px] bg-[hsl(var(--violet))]/16 text-[hsl(var(--violet))]">
              <Video className="size-[17px]" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-[13.5px] font-semibold">{m.title}</p>
                {m.leadId && m.leadName && (
                  <Link
                    href={`/leads/${m.leadId}`}
                    className="truncate text-[12px] text-muted-foreground hover:text-foreground"
                  >
                    · {m.leadName}
                  </Link>
                )}
              </div>
              <p className="mt-0.5 text-[12px] text-muted-foreground">{fmtWhen(m.startsAt)}</p>
            </div>
            {m.meetUrl && (
              <Button variant="outline" size="sm" asChild>
                <a href={m.meetUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="size-3.5" /> Meet
                </a>
              </Button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
