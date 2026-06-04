'use client';

import { Globe, GlobeLock, MapPin, Search, Star, ShieldCheck } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { cn } from '~/lib/utils';
import { trpc } from '~/lib/trpc';

// Filtros del lado del cliente. Places API no soporta filtrar por
// has-website / rating-min / operational en el request, así que los
// aplicamos sobre los resultados (hasta 20 por búsqueda).
type WebFilter = 'any' | 'yes' | 'no';
type RatingFilter = 0 | 3.5 | 4 | 4.5;

const WEB_OPTIONS: { value: WebFilter; label: string }[] = [
  { value: 'any', label: 'Cualquiera' },
  { value: 'yes', label: 'Con web' },
  { value: 'no', label: 'Sin web' },
];

const RATING_OPTIONS: { value: RatingFilter; label: string }[] = [
  { value: 0, label: 'Cualquier rating' },
  { value: 3.5, label: '3.5+' },
  { value: 4, label: '4+' },
  { value: 4.5, label: '4.5+' },
];

// SearchForm — busca texto + ciudad mundial + filtros client-side. La URL es
// la única fuente de verdad para que el usuario pueda compartir el link y
// reproducir la búsqueda exacta. El input local existe solo para no disparar
// la query de tRPC en cada keystroke (sería ráfaga a Places API).
export function SearchForm() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlQuery = searchParams.get('q') ?? '';
  const urlCity = searchParams.get('city') ?? '';
  const urlWeb = (searchParams.get('web') as WebFilter | null) ?? 'any';
  const urlRating = (Number(searchParams.get('minRating')) || 0) as RatingFilter;
  const urlOperational = searchParams.get('operational') === '1';

  const [query, setQuery] = useState(urlQuery);
  const [city, setCity] = useState(urlCity);
  const [web, setWeb] = useState<WebFilter>(urlWeb);
  const [rating, setRating] = useState<RatingFilter>(urlRating);
  const [operational, setOperational] = useState(urlOperational);

  // Sincronizar inputs locales si la URL cambia desde fuera (ej. back del navegador).
  useEffect(() => {
    setQuery(urlQuery);
    setCity(urlCity);
    setWeb(urlWeb);
    setRating(urlRating);
    setOperational(urlOperational);
  }, [urlQuery, urlCity, urlWeb, urlRating, urlOperational]);

  // Autocomplete de ciudades — sugerencia, no restricción. El usuario puede
  // escribir cualquier ciudad del mundo, no solo las que ya tiene en el CRM.
  const facets = trpc.leads.facets.useQuery();
  const citySuggestions = useMemo(
    () => (facets.data?.cities ?? []).map((c) => c.value!).filter(Boolean),
    [facets.data],
  );

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedQ = query.trim();
    const trimmedCity = city.trim();
    if (trimmedQ.length < 2) return;
    const params = new URLSearchParams();
    params.set('q', trimmedQ);
    if (trimmedCity) params.set('city', trimmedCity);
    if (web !== 'any') params.set('web', web);
    if (rating > 0) params.set('minRating', String(rating));
    if (operational) params.set('operational', '1');
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="flex flex-wrap items-end gap-2">
        <div className="relative min-w-[260px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Busca un tipo de negocio: cafetería, barbería, taller mecánico…"
            className="pl-9"
          />
        </div>
        <div className="relative min-w-[200px]">
          <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Ciudad, país (opcional)"
            list="discover-city-suggestions"
            className="pl-9"
          />
          <datalist id="discover-city-suggestions">
            {citySuggestions.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
        <Button type="submit" disabled={query.trim().length < 2}>
          <Search className="size-4" /> Buscar
        </Button>
      </div>

      {/* Filtros client-side aplicados sobre los resultados de Places. */}
      <div className="flex flex-wrap items-center gap-2">
        <SegmentedControl
          icon={web === 'no' ? GlobeLock : Globe}
          label="Web"
          options={WEB_OPTIONS}
          value={web}
          onChange={setWeb}
        />
        <SegmentedControl
          icon={Star}
          label="Rating"
          options={RATING_OPTIONS}
          value={rating}
          onChange={setRating}
        />
        <button
          type="button"
          onClick={() => setOperational((v) => !v)}
          className={cn(
            'hx-press inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors',
            operational
              ? 'border-[hsl(var(--violet))]/40 bg-[hsl(var(--violet))]/12 text-[hsl(var(--violet))]'
              : 'border-border bg-card-2/40 text-muted-foreground hover:text-foreground',
          )}
        >
          <ShieldCheck className="size-3.5" />
          Solo operativos
        </button>
      </div>
    </form>
  );
}

// Segmented control compacto — botón "chip" que rota entre opciones al click.
// Mantiene una sola pieza visual en la barra de filtros (no expande un menu).
function SegmentedControl<T extends string | number>({
  icon: Icon,
  label,
  options,
  value,
  onChange,
}: {
  icon: typeof Search;
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const current = options.find((o) => o.value === value) ?? options[0]!;
  const isActive = current.value !== options[0]!.value;
  const cycle = () => {
    const idx = options.findIndex((o) => o.value === value);
    const next = options[(idx + 1) % options.length]!;
    onChange(next.value);
  };
  return (
    <button
      type="button"
      onClick={cycle}
      className={cn(
        'hx-press inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors',
        isActive
          ? 'border-[hsl(var(--violet))]/40 bg-[hsl(var(--violet))]/12 text-[hsl(var(--violet))]'
          : 'border-border bg-card-2/40 text-muted-foreground hover:text-foreground',
      )}
      aria-label={`${label}: ${current.label}`}
    >
      <Icon className="size-3.5" />
      <span className="text-muted-foreground/80">{label}:</span>
      <span>{current.label}</span>
    </button>
  );
}
