'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, Compass, Settings2 } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';

import { toast } from '~/hooks/use-toast';
import { Button } from '~/components/ui/button';
import { Skeleton } from '~/components/ui/skeleton';
import { trpc } from '~/lib/trpc';
import { BulkImportBar } from './BulkImportBar';
import { PlaceCard } from './PlaceCard';

// Lee la URL para construir el input del query y muestra los estados:
//   - sin query → estado vacío "Busca para empezar"
//   - loading → grid de skeletons
//   - error (incluye API key faltante) → mensaje + CTA a settings
//   - sin resultados → empty con sugerencia
//   - results → grid de PlaceCards + bulk bar
export function ResultsGrid() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') ?? '';
  const city = searchParams.get('city') ?? undefined;
  const hasQuery = query.trim().length >= 2;

  const utils = trpc.useUtils();
  const places = trpc.discover.searchPlaces.useQuery(
    { query, city },
    {
      enabled: hasQuery,
      retry: false, // los errores de API key / billing no se solucionan con retry
    },
  );

  const placeIds = useMemo(() => places.data?.results.map((p) => p.id) ?? [], [places.data]);
  const existing = trpc.discover.existingPlaceIds.useQuery(
    { placeIds },
    { enabled: placeIds.length > 0 },
  );
  const existingSet = useMemo(
    () => new Set(existing.data?.placeIds ?? []),
    [existing.data],
  );

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const importMut = trpc.discover.importPlaces.useMutation({
    onSuccess: (r) => {
      utils.discover.existingPlaceIds.invalidate();
      utils.leads.search.invalidate();
      utils.leads.stats.invalidate();
      utils.leads.facets.invalidate();
      setSelected(new Set());
      toast.success(`${r.imported} lead${r.imported === 1 ? '' : 's'} importado${r.imported === 1 ? '' : 's'} al CRM`);
    },
    onError: (e) => toast.error(e.message),
  });

  if (!hasQuery) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
        <div
          className="grid size-12 place-items-center rounded-[13px] text-[hsl(var(--violet))]"
          style={{
            background:
              'linear-gradient(135deg, hsl(var(--violet) / 0.18), hsl(var(--teal) / 0.18))',
          }}
        >
          <Compass className="size-6" />
        </div>
        <h3 className="mt-4 text-sm font-semibold">Busca para descubrir negocios</h3>
        <p className="mt-1 max-w-sm text-xs text-muted-foreground">
          Empieza con un tipo de negocio (ej. &quot;cafetería&quot;, &quot;veterinaria&quot;) y opcional la ciudad.
        </p>
      </div>
    );
  }

  if (places.isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-44 rounded-xl" />
        ))}
      </div>
    );
  }

  if (places.error) {
    const isMissingKey = places.error.data?.code === 'PRECONDITION_FAILED';
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
        <div className="grid size-12 place-items-center rounded-[13px] bg-rose-500/15 text-rose-400">
          <AlertTriangle className="size-6" />
        </div>
        <h3 className="mt-4 text-sm font-semibold">
          {isMissingKey ? 'Falta configurar Google Places' : 'No se pudo completar la búsqueda'}
        </h3>
        <p className="mt-1 max-w-md text-xs text-muted-foreground">{places.error.message}</p>
        {isMissingKey && (
          <Button asChild variant="outline" size="sm" className="mt-4">
            <Link href="/settings">
              <Settings2 className="size-4" /> Ir a Ajustes
            </Link>
          </Button>
        )}
      </div>
    );
  }

  const results = places.data?.results ?? [];
  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
        <div className="grid size-12 place-items-center rounded-[13px] bg-muted text-muted-foreground">
          <Compass className="size-6" />
        </div>
        <h3 className="mt-4 text-sm font-semibold">Sin resultados</h3>
        <p className="mt-1 max-w-sm text-xs text-muted-foreground">
          Ningún negocio coincide. Prueba con un término más amplio o quita la ciudad.
        </p>
      </div>
    );
  }

  const selectableIds = results.filter((p) => !existingSet.has(p.id)).map((p) => p.id);
  const selectedIds = [...selected].filter((id) => selectableIds.includes(id));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {results.length} resultado{results.length === 1 ? '' : 's'}
          {places.data?.cached && places.data.cachedAt
            ? ` · cache de ${timeAgo(places.data.cachedAt)}`
            : ''}
        </span>
      </div>

      <BulkImportBar
        count={selectedIds.length}
        loading={importMut.isPending}
        onImport={() => importMut.mutate({ placeIds: selectedIds })}
        onClear={() => setSelected(new Set())}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {results.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: Math.min(i * 0.03, 0.3) }}
          >
            <PlaceCard
              place={p}
              selected={selected.has(p.id)}
              alreadyImported={existingSet.has(p.id)}
              onToggle={() => toggle(p.id)}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function timeAgo(date: Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'hace segundos';
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours}h`;
  return 'hace 1 día';
}
