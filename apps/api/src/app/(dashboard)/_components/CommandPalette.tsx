'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Boxes, CalendarClock, FileSpreadsheet, KanbanSquare, Plus, Search, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { BusinessAvatar } from '~/components/business-avatar';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '~/components/ui/command';
import { trpc } from '~/lib/trpc';
import { openNewLeadSheet } from './NewLeadSheet';

function useDebounced<T>(value: T, delay = 200): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return v;
}

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const debounced = useDebounced(query, 200);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const results = trpc.leads.search.useQuery(
    { q: debounced || undefined, sort: 'score', limit: 8, cursor: 0 },
    { enabled: open },
  );

  const go = (href: string) => {
    setOpen(false);
    setQuery('');
    router.push(href);
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[hsl(240_10%_2%/0.6)] backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="fixed left-1/2 top-[14vh] z-50 w-full max-w-[560px] -translate-x-1/2 overflow-hidden rounded-[18px] border border-border-strong bg-card/95 shadow-pop backdrop-blur-2xl data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95">
          <DialogPrimitive.Title className="sr-only">Buscar</DialogPrimitive.Title>
          <Command shouldFilter={false}>
            <CommandInput
              value={query}
              onValueChange={setQuery}
              placeholder="Buscar leads, ir a páginas…"
            />
            <CommandList>
              <CommandGroup heading="Acciones">
                <CommandItem
                  onSelect={() => {
                    setOpen(false);
                    setQuery('');
                    openNewLeadSheet();
                  }}
                >
                  <Plus /> Nuevo lead
                </CommandItem>
                <CommandItem onSelect={() => go('/leads/import')}>
                  <FileSpreadsheet /> Importar leads (CSV/XLSX)
                </CommandItem>
              </CommandGroup>
              <CommandGroup heading="Navegación">
                <CommandItem onSelect={() => go('/leads')}>
                  <Zap /> Ir a Leads
                </CommandItem>
                <CommandItem onSelect={() => go('/today')}>
                  <CalendarClock /> Ir a Hoy
                </CommandItem>
                <CommandItem onSelect={() => go('/pipeline')}>
                  <KanbanSquare /> Ir a Pipeline
                </CommandItem>
                <CommandItem onSelect={() => go('/projects')}>
                  <Boxes /> Ir a Proyectos
                </CommandItem>
              </CommandGroup>

              {debounced && (
                <CommandGroup heading="Leads">
                  {results.isLoading ? (
                    <div className="px-2.5 py-3 text-sm text-muted-foreground">Buscando…</div>
                  ) : results.data && results.data.items.length > 0 ? (
                    results.data.items.map((l) => (
                      <CommandItem key={l.id} value={l.id} onSelect={() => go(`/leads/${l.id}`)}>
                        <BusinessAvatar name={l.businessName} size="sm" />
                        <span className="flex-1 truncate">{l.businessName}</span>
                        <span className="text-xs text-muted-foreground">
                          {[l.category, l.city].filter(Boolean).join(' · ')}
                        </span>
                      </CommandItem>
                    ))
                  ) : (
                    <CommandEmpty>Sin resultados para “{debounced}”.</CommandEmpty>
                  )}
                </CommandGroup>
              )}

              {!debounced && (
                <div className="flex items-center gap-2 px-3 py-3 text-xs text-muted-foreground">
                  <Search className="size-3.5" /> Escribe para buscar entre tus leads
                </div>
              )}
            </CommandList>
          </Command>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
