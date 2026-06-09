'use client';

import { ChevronDown, Globe, GlobeLock, MapPin, Search, ShieldCheck, Star } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { cn } from '~/lib/utils';
import { trpc } from '~/lib/trpc';
import { COUNTRIES, getCountry } from './countries';
import {
  GROUP_LABELS,
  SOURCES_CONFIG,
  type Source,
  type SourceGroup,
  getSourcesByGroup,
} from './sources-config';

// Filtros client-side aplicados sobre los resultados. Solo se muestran si
// la fuente seleccionada los soporta (config en sources-config.ts).
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

const VALID_SOURCES = Object.keys(SOURCES_CONFIG) as Source[];

function parseSource(v: string | null): Source {
  return (VALID_SOURCES as readonly string[]).includes(v ?? '') ? (v as Source) : 'google';
}

// SearchForm dinámico — los campos visibles se determinan por la config de
// la fuente elegida. Todos los valores viven en la URL para que el link sea
// compartible y reproducible.
export function SearchForm() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlQuery = searchParams.get('q') ?? '';
  const urlCity = searchParams.get('city') ?? '';
  const urlCountry = searchParams.get('country') ?? '';
  const urlSource = parseSource(searchParams.get('source'));
  const urlWeb = (searchParams.get('web') as WebFilter | null) ?? 'any';
  const urlRating = (Number(searchParams.get('minRating')) || 0) as RatingFilter;
  const urlOperational = searchParams.get('operational') === '1';

  const [query, setQuery] = useState(urlQuery);
  const [city, setCity] = useState(urlCity);
  const [country, setCountry] = useState(urlCountry);
  const [source, setSource] = useState<Source>(urlSource);
  const [web, setWeb] = useState<WebFilter>(urlWeb);
  const [rating, setRating] = useState<RatingFilter>(urlRating);
  const [operational, setOperational] = useState(urlOperational);

  useEffect(() => {
    setQuery(urlQuery);
    setCity(urlCity);
    setCountry(urlCountry);
    setSource(urlSource);
    setWeb(urlWeb);
    setRating(urlRating);
    setOperational(urlOperational);
  }, [urlQuery, urlCity, urlCountry, urlSource, urlWeb, urlRating, urlOperational]);

  // Config de la fuente elegida — fuente de verdad para qué campos mostrar.
  const config = SOURCES_CONFIG[source];

  // Sugerencias de ciudades: pre-poblamos con ciudades que el usuario ya tiene
  // en su CRM. NO restringe: puede escribir cualquier ciudad del mundo.
  const facets = trpc.leads.facets.useQuery();
  const citySuggestions = useMemo(
    () => (facets.data?.cities ?? []).map((c) => c.value!).filter(Boolean),
    [facets.data],
  );

  // Si la fuente NUEVA no soporta un campo que estaba lleno, lo limpiamos en
  // memoria local (pero NO patcheamos URL — el efecto se aplica en submit).
  useEffect(() => {
    if (!config.fields.city && city) setCity('');
    if (!config.fields.country && !config.fields.pinnedCountry && country) setCountry('');
    if (!config.filters.web && web !== 'any') setWeb('any');
    if (!config.filters.rating && rating !== 0) setRating(0);
    if (!config.filters.operational && operational) setOperational(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedQ = query.trim();
    if (trimmedQ.length < 2) return;
    const params = new URLSearchParams();
    params.set('q', trimmedQ);
    if (source !== 'google') params.set('source', source);
    if (config.fields.city && city.trim()) params.set('city', city.trim());
    if (config.fields.country && country) params.set('country', country);
    if (config.filters.web && web !== 'any') params.set('web', web);
    if (config.filters.rating && rating > 0) params.set('minRating', String(rating));
    if (config.filters.operational && operational) params.set('operational', '1');
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const hasAnyFilter =
    config.filters.web || config.filters.rating || config.filters.operational;

  return (
    <form onSubmit={submit} className="space-y-3">
      {/* Source picker — botones agrupados */}
      <div className="space-y-2">
        {(['businesses', 'freelance'] as const).map((group) => (
          <SourceGroupRow
            key={group}
            label={GROUP_LABELS[group]}
            options={getSourcesByGroup(group)}
            active={source}
            onChange={setSource}
          />
        ))}
      </div>

      {/* Hint contextual de la fuente elegida */}
      <p className="text-xs text-muted-foreground">{config.hint}</p>

      {/* Campos del form — se renderizan según la config */}
      <div className="flex flex-wrap items-end gap-2">
        <div className="relative min-w-[260px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={config.fields.query.placeholder}
            className="pl-9"
          />
        </div>

        {config.fields.city && (
          <div className="relative min-w-[200px]">
            <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder={config.fields.city.placeholder}
              list="discover-city-suggestions"
              className="pl-9"
            />
            <datalist id="discover-city-suggestions">
              {citySuggestions.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
        )}

        {config.fields.country && (
          <CountrySelect value={country} onChange={setCountry} />
        )}

        {config.fields.pinnedCountry && (
          <span className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-card-2/40 px-3 text-xs text-muted-foreground">
            {getCountry(config.fields.pinnedCountry)?.flag}{' '}
            {getCountry(config.fields.pinnedCountry)?.name}
          </span>
        )}

        <Button type="submit" disabled={query.trim().length < 2}>
          <Search className="size-4" /> Buscar
        </Button>
      </div>

      {/* Help text bajo la query si lo hay */}
      {config.fields.query.helpText && (
        <p className="text-[11px] text-muted-foreground">{config.fields.query.helpText}</p>
      )}

      {/* Filtros client-side — solo los que la fuente soporta */}
      {hasAnyFilter && (
        <div className="flex flex-wrap items-center gap-2">
          {config.filters.web && (
            <SegmentedControl
              icon={web === 'no' ? GlobeLock : Globe}
              label="Web"
              options={WEB_OPTIONS}
              value={web}
              onChange={setWeb}
            />
          )}
          {config.filters.rating && (
            <SegmentedControl
              icon={Star}
              label="Rating"
              options={RATING_OPTIONS}
              value={rating}
              onChange={setRating}
            />
          )}
          {config.filters.operational && (
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
          )}
        </div>
      )}
    </form>
  );
}

// Fila de botones para un grupo de fuentes.
function SourceGroupRow({
  label,
  options,
  active,
  onChange,
}: {
  label: string;
  options: ReturnType<typeof getSourcesByGroup>;
  active: Source;
  onChange: (s: Source) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-[120px] shrink-0 text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const Ico = opt.icon;
          const isActive = active === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.id)}
              className={cn(
                'hx-press inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                isActive
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
}

// Dropdown nativo de país. Usar `<select>` HTML para no agregar dep — los
// flag emojis renderizan bien en todos los browsers modernos.
function CountrySelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const selected = getCountry(value);
  return (
    <div className="relative min-w-[180px]">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base">
        {selected ? selected.flag : '🌐'}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="hx-press h-9 w-full appearance-none rounded-md border border-border bg-card-2/60 pl-9 pr-8 text-sm text-foreground transition-colors hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        aria-label="País"
      >
        <option value="">País (cualquiera)</option>
        {COUNTRIES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.flag} {c.name}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}

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
