'use client';

import { Search } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { Button } from '~/components/ui/button';
import { Combobox } from '~/components/ui/combobox';
import { Input } from '~/components/ui/input';
import { trpc } from '~/lib/trpc';

// Form de búsqueda Discover. Filtros persistidos en la URL (`?q=...&city=...`)
// — la URL es la única fuente de verdad: el usuario puede compartir el link
// con su equipo y la búsqueda se reproduce idéntica.
//
// El input local existe solo para que escribir no dispare la query de tRPC en
// cada keystroke (sería ráfaga de calls a Places API). Solo al hacer submit
// se patchea la URL y entonces se dispara la query.
export function SearchForm() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlQuery = searchParams.get('q') ?? '';
  const urlCity = searchParams.get('city') ?? undefined;

  const [query, setQuery] = useState(urlQuery);
  const [city, setCity] = useState<string | undefined>(urlCity);

  // Sincronizar input local si la URL cambia desde fuera (ej. back del navegador).
  useEffect(() => {
    setQuery(urlQuery);
    setCity(urlCity);
  }, [urlQuery, urlCity]);

  // Sugerencias de ciudades — reusamos el endpoint facets de leads que ya
  // agrupa por ciudad las ciudades existentes en el CRM.
  const facets = trpc.leads.facets.useQuery();
  const cityOptions = useMemo(
    () => (facets.data?.cities ?? []).map((c) => ({ value: c.value!, label: c.value! })),
    [facets.data],
  );

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed.length < 2) return;
    const params = new URLSearchParams();
    params.set('q', trimmed);
    if (city) params.set('city', city);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-2">
      <div className="relative min-w-[260px] flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Busca un tipo de negocio: cafetería, barbería, taller mecánico…"
          className="pl-9"
        />
      </div>
      <Combobox
        value={city}
        onChange={setCity}
        options={cityOptions}
        placeholder="Ciudad (opcional)"
        searchPlaceholder="Buscar ciudad…"
      />
      <Button type="submit" disabled={query.trim().length < 2}>
        <Search className="size-4" /> Buscar
      </Button>
    </form>
  );
}
