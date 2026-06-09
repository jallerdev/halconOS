'use client';

import { Clock, History, Trash2, X } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '~/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover';
import { cn } from '~/lib/utils';
import { getCountry } from './countries';
import { SOURCES_CONFIG } from './sources-config';
import { useSearchHistory, type HistoryEntry } from './use-search-history';

// Drawer flotante con las últimas búsquedas del usuario. Click → repite la
// búsqueda con esos mismos params en la URL. Aparece como popover al lado
// del botón con icono History.
export function SearchHistory() {
  const router = useRouter();
  const pathname = usePathname();
  const { entries, clear, remove } = useSearchHistory();
  const [open, setOpen] = useState(false);

  const restore = (entry: HistoryEntry) => {
    const params = new URLSearchParams();
    params.set('q', entry.query);
    if (entry.source !== 'google') params.set('source', entry.source);
    if (entry.city) params.set('city', entry.city);
    if (entry.country) params.set('country', entry.country);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 gap-1.5"
        >
          <History className="size-4" />
          Historial
          {entries.length > 0 && (
            <span className="rounded-full bg-[hsl(var(--violet))]/15 px-1.5 text-[10px] font-semibold text-[hsl(var(--violet))]">
              {entries.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[360px] p-0">
        <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
          <span className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">
            Búsquedas recientes
          </span>
          {entries.length > 0 && (
            <button
              type="button"
              onClick={clear}
              className="text-[11px] text-muted-foreground transition-colors hover:text-foreground"
            >
              Limpiar
            </button>
          )}
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {entries.length === 0 ? (
            <div className="px-3 py-8 text-center">
              <Clock className="mx-auto size-6 text-muted-foreground/60" />
              <p className="mt-2 text-xs text-muted-foreground">
                No hay búsquedas todavía. Cuando hagas una, aparecerá aquí.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {entries.map((entry) => (
                <li key={entry.id} className="group relative">
                  <button
                    type="button"
                    onClick={() => restore(entry)}
                    className="flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors hover:bg-accent"
                  >
                    <SourceBadge source={entry.source} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{entry.query}</div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-muted-foreground">
                        {entry.city && <span className="truncate">{entry.city}</span>}
                        {entry.country && getCountry(entry.country) && (
                          <span>{getCountry(entry.country)!.flag}</span>
                        )}
                        <span>·</span>
                        <span>{entry.resultCount} resultado{entry.resultCount === 1 ? '' : 's'}</span>
                        <span>·</span>
                        <span>{timeAgo(entry.ts)}</span>
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      remove(entry.id);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground/50 opacity-0 transition-opacity hover:bg-accent hover:text-foreground group-hover:opacity-100"
                    aria-label="Quitar del historial"
                  >
                    <X className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {entries.length > 0 && (
          <div className="flex items-center gap-1.5 border-t border-border bg-card-2/40 px-3 py-2 text-[11px] text-muted-foreground">
            <Trash2 className="size-3" />
            <span>Solo se guarda en este navegador.</span>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

function SourceBadge({ source }: { source: string }) {
  const config = SOURCES_CONFIG[source as keyof typeof SOURCES_CONFIG];
  if (!config) {
    return (
      <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        ?
      </span>
    );
  }
  const Ico = config.icon;
  return (
    <span
      className={cn(
        'mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-md',
        'bg-[hsl(var(--violet))]/12 text-[hsl(var(--violet))]',
      )}
      title={config.label}
    >
      <Ico className="size-3.5" />
    </span>
  );
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}
