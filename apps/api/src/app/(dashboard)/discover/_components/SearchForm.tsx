'use client';

import {
  Globe,
  GlobeLock,
  MapPin,
  Search,
  Star,
  ShieldCheck,
  Map as MapIcon,
  BookOpen,
  Telescope,
  Briefcase,
  Network,
  Earth,
} from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { cn } from '~/lib/utils';
import { trpc } from '~/lib/trpc';

// Fuentes de descubrimiento. `google` usa la API oficial; el resto va al
// microservicio Python (apps/scraper/). Agrupadas por confiabilidad para que el
// usuario sepa cuáles fallan más.
type Source =
  | 'google'
  | 'openstreetmap'
  | 'paginas-amarillas-co'
  | 'paginas-amarillas-mx'
  | 'paginas-amarillas-ar'
  | 'bing-search'
  | 'duckduckgo-search'
  | 'computrabajo'
  | 'bumeran'
  | 'indeed'
  | 'linkedin-jobs'
  | 'workana';

type SourceOption = {
  value: Source;
  label: string;
  icon: typeof Search;
  hint: string;
  group: 'reliable' | 'jobs' | 'freelance' | 'experimental';
};

const SOURCE_OPTIONS: SourceOption[] = [
  // Grupo 1 — confiables (HTML estático, alta tasa de éxito).
  { value: 'google', label: 'Google Places', icon: MapIcon, hint: 'Oficial · rápido', group: 'reliable' },
  { value: 'openstreetmap', label: 'OpenStreetMap', icon: Earth, hint: 'Mapa público · gratis', group: 'reliable' },
  { value: 'paginas-amarillas-co', label: 'P. Amarillas CO', icon: BookOpen, hint: 'Directorio Colombia', group: 'reliable' },
  { value: 'paginas-amarillas-mx', label: 'P. Amarillas MX', icon: BookOpen, hint: 'Directorio México', group: 'reliable' },
  { value: 'paginas-amarillas-ar', label: 'P. Amarillas AR', icon: BookOpen, hint: 'Directorio Argentina', group: 'reliable' },
  { value: 'bing-search', label: 'Bing Search', icon: Telescope, hint: 'Búsqueda + scrape top', group: 'reliable' },
  { value: 'duckduckgo-search', label: 'DuckDuckGo', icon: Telescope, hint: 'Búsqueda + scrape top', group: 'reliable' },
  // Grupo 2 — jobs (empresas que contratan = empresas con presupuesto).
  { value: 'computrabajo', label: 'Computrabajo', icon: Briefcase, hint: 'Empresas que contratan en LatAm', group: 'jobs' },
  { value: 'bumeran', label: 'Bumeran', icon: Briefcase, hint: 'Empleos AR/MX/PE/CL', group: 'jobs' },
  { value: 'indeed', label: 'Indeed', icon: Briefcase, hint: 'Empleos global · puede fallar', group: 'jobs' },
  // Grupo 3 — freelancers (plataformas de talento independiente).
  { value: 'workana', label: 'Workana', icon: Briefcase, hint: 'Freelancers LatAm', group: 'freelance' },
  // Grupo 4 — experimentales (anti-bot agresivo, fallan seguido).
  { value: 'linkedin-jobs', label: 'LinkedIn Jobs', icon: Network, hint: 'Experimental · LinkedIn bloquea seguido', group: 'experimental' },
];

const GROUP_LABELS: Record<SourceOption['group'], string> = {
  reliable: 'Confiables',
  jobs: 'Empresas que contratan',
  freelance: 'Freelancers',
  experimental: 'Experimentales',
};

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
  const urlSource = ((SOURCE_OPTIONS.find((s) => s.value === searchParams.get('source'))?.value) ??
    'google') as Source;
  const urlWeb = (searchParams.get('web') as WebFilter | null) ?? 'any';
  const urlRating = (Number(searchParams.get('minRating')) || 0) as RatingFilter;
  const urlOperational = searchParams.get('operational') === '1';

  const [query, setQuery] = useState(urlQuery);
  const [city, setCity] = useState(urlCity);
  const [source, setSource] = useState<Source>(urlSource);
  const [web, setWeb] = useState<WebFilter>(urlWeb);
  const [rating, setRating] = useState<RatingFilter>(urlRating);
  const [operational, setOperational] = useState(urlOperational);

  // Sincronizar inputs locales si la URL cambia desde fuera (ej. back del navegador).
  useEffect(() => {
    setQuery(urlQuery);
    setCity(urlCity);
    setSource(urlSource);
    setWeb(urlWeb);
    setRating(urlRating);
    setOperational(urlOperational);
  }, [urlQuery, urlCity, urlSource, urlWeb, urlRating, urlOperational]);

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
    if (source !== 'google') params.set('source', source);
    if (web !== 'any') params.set('web', web);
    if (rating > 0) params.set('minRating', String(rating));
    if (operational) params.set('operational', '1');
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      {/* Fuente — botones agrupados por confiabilidad. */}
      <div className="space-y-2">
        {(['reliable', 'jobs', 'freelance', 'experimental'] as const).map((group) => {
          const opts = SOURCE_OPTIONS.filter((o) => o.group === group);
          if (opts.length === 0) return null;
          return (
            <div key={group} className="flex flex-wrap items-center gap-2">
              <span className="w-[150px] shrink-0 text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                {GROUP_LABELS[group]}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {opts.map((opt) => {
                  const Ico = opt.icon;
                  const active = source === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setSource(opt.value)}
                      className={cn(
                        'hx-press inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                        active
                          ? 'border-[hsl(var(--violet))]/40 bg-[hsl(var(--violet))]/15 text-[hsl(var(--violet))]'
                          : 'border-border bg-card-2/40 text-muted-foreground hover:bg-accent hover:text-foreground',
                      )}
                      title={opt.hint}
                    >
                      <Ico className="size-3" />
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

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
