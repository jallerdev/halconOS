'use client';

import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';
import { cn } from '~/lib/utils';

export type ComboOption = { value: string; label: string; hint?: string | number };

export function Combobox({
  value,
  onChange,
  options,
  placeholder = 'Seleccionar…',
  searchPlaceholder = 'Buscar…',
  className,
}: {
  value: string | undefined;
  onChange: (v: string | undefined) => void;
  options: ComboOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  const selected = options.find((o) => o.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            'inline-flex h-9 items-center justify-between gap-2 rounded-md border border-border bg-card-2/60 px-3 text-sm transition-colors hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
            className,
          )}
        >
          <span className={cn('truncate', !selected && 'text-muted-foreground')}>
            {selected ? selected.label : placeholder}
          </span>
          <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0">
        <div className="flex items-center gap-2 border-b border-border px-3 py-2">
          <Search className="size-3.5 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div className="max-h-64 overflow-y-auto p-1">
          {value && (
            <button
              onClick={() => {
                onChange(undefined);
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent"
            >
              Limpiar selección
            </button>
          )}
          {filtered.length === 0 ? (
            <div className="px-2.5 py-6 text-center text-xs text-muted-foreground">
              Sin resultados
            </div>
          ) : (
            filtered.map((o) => (
              <button
                key={o.value}
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                  setQuery('');
                }}
                className="flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-sm transition-colors hover:bg-accent"
              >
                <span className="flex items-center gap-2 truncate">
                  <Check
                    className={cn('size-3.5', value === o.value ? 'opacity-100' : 'opacity-0')}
                  />
                  <span className="truncate">{o.label}</span>
                </span>
                {o.hint != null && (
                  <span className="shrink-0 text-xs text-muted-foreground">{o.hint}</span>
                )}
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
