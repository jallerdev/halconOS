'use client';

import {
  ChevronDown,
  ChevronRight,
  Globe,
  GlobeLock,
  Info,
  MapPin,
  Search,
  ShieldCheck,
  Star,
} from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { Button } from '~/components/ui/button';
import { Combobox } from '~/components/ui/combobox';
import { Input } from '~/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '~/components/ui/tooltip';
import { cn } from '~/lib/utils';
import { COUNTRIES, getCountry } from './countries';
import {
  SOURCES_CONFIG,
  type Source,
  getSourcesByTier,
} from './sources-config';

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

// Keys de URL que el form gestiona — al cambiar de fuente borramos las que
// la nueva no soporta.
const ALL_URL_KEYS = ['q', 'city', 'country', 'source', 'web', 'minRating', 'operational'] as const;

const ADVANCED_TOGGLE_LS_KEY = 'halcon:discover:show-advanced-sources';

function parseSource(v: string | null): Source {
  return (VALID_SOURCES as readonly string[]).includes(v ?? '') ? (v as Source) : 'google';
}

// SearchForm dinámico — los campos visibles se determinan por la config de
// la fuente elegida. Todos los valores viven en la URL para que el link sea
// compartible y reproducible. Las fuentes 'advanced' se ocultan tras un toggle
// para no abrumar al usuario que solo quiere las 6 fuentes principales.
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
  const [source, setSourceState] = useState<Source>(urlSource);
  const [web, setWeb] = useState<WebFilter>(urlWeb);
  const [rating, setRating] = useState<RatingFilter>(urlRating);
  const [operational, setOperational] = useState(urlOperational);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Cargar preferencia de "Mostrar avanzado" de localStorage la primera vez.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(ADVANCED_TOGGLE_LS_KEY);
    if (stored === '1') setShowAdvanced(true);
    // Si el source activo es 'advanced', auto-expandir el toggle para que el
    // usuario lo vea seleccionado (sino parecería que desapareció).
    if (SOURCES_CONFIG[urlSource].tier === 'advanced') setShowAdvanced(true);
  }, [urlSource]);

  useEffect(() => {
    setQuery(urlQuery);
    setCity(urlCity);
    setCountry(urlCountry);
    setSourceState(urlSource);
    setWeb(urlWeb);
    setRating(urlRating);
    setOperational(urlOperational);
  }, [urlQuery, urlCity, urlCountry, urlSource, urlWeb, urlRating, urlOperational]);

  const config = SOURCES_CONFIG[source];

  // Al cambiar de fuente, limpiamos URL params para los campos/filtros que la
  // nueva fuente NO soporta. Antes solo limpiábamos memoria, lo que dejaba
  // params huérfanos en la URL al re-submit (filtros fantasma).
  const changeSource = useCallback(
    (next: Source) => {
      setSourceState(next);
      const nextConfig = SOURCES_CONFIG[next];
      const params = new URLSearchParams(searchParams.toString());
      params.set('source', next === 'google' ? '' : next);
      if (!nextConfig.fields.city) params.delete('city');
      if (!nextConfig.fields.country && !nextConfig.fields.pinnedCountry) {
        params.delete('country');
      }
      if (!nextConfig.filters.web) params.delete('web');
      if (!nextConfig.filters.rating) params.delete('minRating');
      if (!nextConfig.filters.operational) params.delete('operational');
      // Si 'source' quedó vacío, removerlo de la URL para no dejar `?source=`.
      if (params.get('source') === '') params.delete('source');
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const toggleAdvanced = () => {
    const next = !showAdvanced;
    setShowAdvanced(next);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(ADVANCED_TOGGLE_LS_KEY, next ? '1' : '0');
    }
  };

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

  const primarySources = useMemo(() => getSourcesByTier('primary'), []);
  const advancedSources = useMemo(() => getSourcesByTier('advanced'), []);

  // Opciones del Combobox de país (flag + nombre). El Combobox filtra por
  // `label` así que el flag al inicio facilita reconocer visualmente.
  const countryOptions = useMemo(
    () =>
      COUNTRIES.map((c) => ({
        value: c.code,
        label: `${c.flag} ${c.name}`,
      })),
    [],
  );

  return (
    <TooltipProvider delayDuration={250}>
      <form onSubmit={submit} className="space-y-3">
        {/* Source picker — un solo grupo con toggle de avanzado */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-[80px] shrink-0 text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
              Fuente
            </span>
            <div className="flex flex-wrap gap-1.5">
              {primarySources.map((opt) => (
                <SourcePill
                  key={opt.id}
                  source={opt.id}
                  label={opt.label}
                  icon={opt.icon}
                  hint={opt.hint}
                  active={source === opt.id}
                  onClick={() => changeSource(opt.id)}
                />
              ))}
              <button
                type="button"
                onClick={toggleAdvanced}
                className="hx-press inline-flex items-center gap-1 rounded-full border border-dashed border-border bg-transparent px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                title="Fuentes adicionales para casos puntuales"
              >
                <ChevronRight
                  className={cn('size-3 transition-transform', showAdvanced && 'rotate-90')}
                />
                {showAdvanced ? 'Ocultar' : `Mostrar ${advancedSources.length} más`}
              </button>
            </div>
          </div>
          {showAdvanced && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="w-[80px] shrink-0 text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/60">
                Avanzado
              </span>
              <div className="flex flex-wrap gap-1.5">
                {advancedSources.map((opt) => (
                  <SourcePill
                    key={opt.id}
                    source={opt.id}
                    label={opt.label}
                    icon={opt.icon}
                    hint={opt.hint}
                    active={source === opt.id}
                    onClick={() => changeSource(opt.id)}
                    muted
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Hint contextual de la fuente elegida */}
        <p className="text-xs text-muted-foreground">{config.hint}</p>

        {/* Campos del form */}
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
                className="pl-9"
              />
            </div>
          )}

          {config.fields.country && (
            <div className="min-w-[200px]">
              <Combobox
                value={country || undefined}
                onChange={(v) => setCountry(v ?? '')}
                options={countryOptions}
                placeholder="🌐 País (cualquiera)"
                searchPlaceholder="Buscar país…"
                className="w-full"
              />
            </div>
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

        {config.fields.query.helpText && (
          <p className="text-[11px] text-muted-foreground">{config.fields.query.helpText}</p>
        )}

        {/* Filtros client-side con tooltips explicativos */}
        {hasAnyFilter && (
          <div className="flex flex-wrap items-center gap-2">
            {config.filters.web && (
              <FilterWithInfo
                tip="Filtra resultados localmente — no cambia la búsqueda en la fuente. Útil cuando quieres negocios sin web (oportunidad) o solo con web (más establecidos)."
              >
                <SegmentedControl
                  icon={web === 'no' ? GlobeLock : Globe}
                  label="Web"
                  options={WEB_OPTIONS}
                  value={web}
                  onChange={setWeb}
                />
              </FilterWithInfo>
            )}
            {config.filters.rating && (
              <FilterWithInfo
                tip="Filtra los resultados localmente por rating mínimo. Solo aplica a fuentes que traen rating (Google Places, Páginas Amarillas)."
              >
                <SegmentedControl
                  icon={Star}
                  label="Rating"
                  options={RATING_OPTIONS}
                  value={rating}
                  onChange={setRating}
                />
              </FilterWithInfo>
            )}
            {config.filters.operational && (
              <FilterWithInfo tip="Excluye negocios marcados como cerrados temporal o permanentemente. Solo aplica a Google Places.">
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
              </FilterWithInfo>
            )}
          </div>
        )}
      </form>
    </TooltipProvider>
  );
}

// Pill individual de fuente.
function SourcePill({
  source: _source,
  label,
  icon: Icon,
  hint,
  active,
  onClick,
  muted = false,
}: {
  source: Source;
  label: string;
  icon: typeof Search;
  hint: string;
  active: boolean;
  onClick: () => void;
  muted?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={hint}
      className={cn(
        'hx-press inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
        active
          ? 'border-[hsl(var(--violet))]/40 bg-[hsl(var(--violet))]/15 text-[hsl(var(--violet))]'
          : muted
            ? 'border-border/60 bg-card-2/30 text-muted-foreground/80 hover:bg-accent hover:text-foreground'
            : 'border-border bg-card-2/40 text-muted-foreground hover:bg-accent hover:text-foreground',
      )}
    >
      <Icon className="size-3" />
      {label}
    </button>
  );
}

// Wrapper que añade un icon Info al lado del control con un tooltip explicativo.
function FilterWithInfo({ tip, children }: { tip: string; children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-1">
      {children}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            tabIndex={-1}
            className="inline-flex size-4 items-center justify-center text-muted-foreground/60 transition-colors hover:text-muted-foreground"
            aria-label="Más info"
          >
            <Info className="size-3" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[260px] text-xs">
          {tip}
        </TooltipContent>
      </Tooltip>
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

// Re-export por compat — algunos imports lo usaban; ahora ALL_URL_KEYS es interno.
export { ALL_URL_KEYS };
