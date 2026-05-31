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
        <Video className="size-4 text-primary" />
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Próximas reuniones
        </h2>
      </header>

      <ul className="divide-y divide-border/60 rounded-xl border border-border/60 bg-card/60">
        {data.map((m) => (
          <li key={m.id} className="flex items-center gap-3 p-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-medium">{m.title}</p>
                {m.leadId && m.leadName && (
                  <Link
                    href={`/leads/${m.leadId}`}
                    className="truncate text-xs text-muted-foreground hover:text-foreground"
                  >
                    · {m.leadName}
                  </Link>
                )}
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">{fmtWhen(m.startsAt)}</p>
            </div>
            {m.meetUrl && (
              <Button variant="outline" size="sm" asChild>
                <a href={m.meetUrl} target="_blank" rel="noreferrer">
                  <ExternalLink /> Meet
                </a>
              </Button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
