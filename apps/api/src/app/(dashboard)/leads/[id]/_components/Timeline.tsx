import { CheckCircle2, FileText, Flag, MapPin, UserPlus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type Event = { icon: LucideIcon; title: string; date: Date | null; tone: string };

export function Timeline({
  createdAt,
  updatedAt,
  convertedAt,
  scrapedAt,
  status,
}: {
  createdAt: Date | string;
  updatedAt: Date | string;
  convertedAt: Date | string | null;
  scrapedAt: Date | string | null;
  status: string;
}) {
  const d = (v: Date | string | null) => (v ? new Date(v) : null);

  const events: Event[] = [
    scrapedAt && {
      icon: MapPin,
      title: 'Extraído de Google Maps',
      date: d(scrapedAt),
      tone: 'text-sky-400 bg-sky-500/10',
    },
    {
      icon: UserPlus,
      title: 'Lead agregado al pipeline',
      date: d(createdAt),
      tone: 'text-violet-400 bg-violet-500/10',
    },
    status !== 'NEW' && {
      icon: Flag,
      title: 'Estado actualizado',
      date: d(updatedAt),
      tone: 'text-amber-400 bg-amber-500/10',
    },
    convertedAt && {
      icon: CheckCircle2,
      title: 'Convertido a proyecto',
      date: d(convertedAt),
      tone: 'text-emerald-400 bg-emerald-500/10',
    },
  ].filter(Boolean) as Event[];

  const fmt = (date: Date | null) =>
    date
      ? date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
      : '—';

  return (
    <ol className="relative ml-3 border-l border-border/60">
      {events.map((e, i) => (
        <li key={i} className="mb-6 ml-6 last:mb-0">
          <span
            className={`absolute -left-3 flex size-6 items-center justify-center rounded-full ring-4 ring-background ${e.tone}`}
          >
            <e.icon className="size-3" />
          </span>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-foreground">{e.title}</span>
            <span className="text-xs text-muted-foreground">{fmt(e.date)}</span>
          </div>
        </li>
      ))}
      {events.length === 0 && (
        <li className="ml-6 flex items-center gap-2 text-sm text-muted-foreground">
          <FileText className="size-4" /> Sin actividad registrada.
        </li>
      )}
    </ol>
  );
}
