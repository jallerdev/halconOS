import { CheckCircle2, FileText, Flag, MapPin, UserPlus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// Timeline — eventos del lead a lo largo del tiempo. Cada evento tiene un
// dot circular con tone propio (sky/violet/amber/teal). Match con el
// .timeline / .tl-item del handoff.
type Event = { icon: LucideIcon; title: string; date: Date | null; bg: string; text: string };

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
      bg: 'bg-sky-500/15',
      text: 'text-sky-400',
    },
    {
      icon: UserPlus,
      title: 'Lead agregado al pipeline',
      date: d(createdAt),
      bg: 'bg-[hsl(var(--violet))]/15',
      text: 'text-[hsl(var(--violet))]',
    },
    status !== 'NEW' && {
      icon: Flag,
      title: 'Estado actualizado',
      date: d(updatedAt),
      bg: 'bg-amber-500/15',
      text: 'text-amber-400',
    },
    convertedAt && {
      icon: CheckCircle2,
      title: 'Convertido a proyecto',
      date: d(convertedAt),
      bg: 'bg-[hsl(var(--teal))]/15',
      text: 'text-[hsl(var(--teal))]',
    },
  ].filter(Boolean) as Event[];

  const fmt = (date: Date | null) =>
    date
      ? date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
      : '—';

  return (
    <ol className="relative ml-3 border-l border-border">
      {events.map((e, i) => (
        <li key={i} className="mb-6 ml-6 last:mb-0">
          <span
            className={`absolute -left-3 grid size-6 place-items-center rounded-full ring-4 ring-card ${e.bg} ${e.text}`}
          >
            <e.icon className="size-3" />
          </span>
          <div className="flex flex-col">
            <span className="text-[13.5px] font-semibold text-foreground">{e.title}</span>
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
