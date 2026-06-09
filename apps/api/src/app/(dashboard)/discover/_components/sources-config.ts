// Config declarativo de cada fuente — qué campos pide y qué filtros aplican.
// El SearchForm renderiza dinámicamente basándose en esto: si una fuente NO
// pide city/country, el input simplemente no aparece.
//
// Cuando agregues una fuente nueva: registra su comportamiento aquí + agrega
// el entry visual en SearchForm.tsx (icono + grupo).

import {
  BookOpen,
  Briefcase,
  Earth,
  Map as MapIcon,
  Network,
  Telescope,
  type LucideIcon,
} from 'lucide-react';

export type Source =
  | 'google'
  | 'openstreetmap'
  | 'paginas-amarillas-co'
  | 'paginas-amarillas-mx'
  | 'paginas-amarillas-ar'
  | 'bing-search'
  | 'duckduckgo-search'
  | 'clutch'
  | 'workana'
  | 'fiverr'
  | 'behance'
  | 'dribbble';

export type SourceGroup = 'businesses' | 'freelance';

// `pinnedCountry` indica que la fuente solo opera en UN país (Páginas Amarillas
// CO sólo busca en Colombia). En ese caso ocultamos el dropdown de país y
// usamos el pinned como valor implícito.
export type SourceConfig = {
  id: Source;
  label: string;
  icon: LucideIcon;
  group: SourceGroup;
  hint: string;
  // Campos del form que se muestran:
  fields: {
    query: { placeholder: string; helpText?: string };
    city?: { placeholder: string; helpText?: string };
    country?: { default?: string };
    pinnedCountry?: string; // Si la fuente es país-específica
  };
  // Filtros que aplican a los resultados:
  filters: {
    web?: boolean;
    rating?: boolean;
    operational?: boolean;
  };
};

export const SOURCES_CONFIG: Record<Source, SourceConfig> = {
  google: {
    id: 'google',
    label: 'Google Places',
    icon: MapIcon,
    group: 'businesses',
    hint: 'Oficial · rápido · mundial',
    fields: {
      query: {
        placeholder: 'Negocio o categoría (ej. cafetería, dentista, agencia marketing)',
        helpText: 'Busca cualquier tipo de negocio en cualquier ciudad del mundo.',
      },
      city: { placeholder: 'Ciudad (ej. Medellín, Buenos Aires, NYC)' },
      country: {},
    },
    filters: { web: true, rating: true, operational: true },
  },

  openstreetmap: {
    id: 'openstreetmap',
    label: 'OpenStreetMap',
    icon: Earth,
    group: 'businesses',
    hint: 'Mapa público · gratis · mundial',
    fields: {
      query: {
        placeholder: 'Categoría (cafetería, farmacia, barbería)',
        helpText: 'OSM reconoce categorías comunes. No incluye ratings ni reseñas.',
      },
      city: { placeholder: 'Ciudad (cualquier país)' },
      country: {},
    },
    filters: { web: true }, // OSM no tiene rating ni business status
  },

  'paginas-amarillas-co': {
    id: 'paginas-amarillas-co',
    label: 'P. Amarillas CO',
    icon: BookOpen,
    group: 'businesses',
    hint: 'Directorio Colombia',
    fields: {
      query: { placeholder: 'Negocio (ej. barbería, restaurante)' },
      city: { placeholder: 'Ciudad (ej. Bogotá, Medellín, Cali)' },
      pinnedCountry: 'CO',
    },
    filters: { web: true, rating: true },
  },

  'paginas-amarillas-mx': {
    id: 'paginas-amarillas-mx',
    label: 'P. Amarillas MX',
    icon: BookOpen,
    group: 'businesses',
    hint: 'Directorio México',
    fields: {
      query: { placeholder: 'Negocio (ej. restaurante, dentista)' },
      city: { placeholder: 'Ciudad (ej. CDMX, Guadalajara, Monterrey)' },
      pinnedCountry: 'MX',
    },
    filters: { web: true, rating: true },
  },

  'paginas-amarillas-ar': {
    id: 'paginas-amarillas-ar',
    label: 'P. Amarillas AR',
    icon: BookOpen,
    group: 'businesses',
    hint: 'Directorio Argentina',
    fields: {
      query: { placeholder: 'Negocio (ej. parrilla, gimnasio)' },
      city: { placeholder: 'Ciudad (ej. Buenos Aires, Córdoba, Rosario)' },
      pinnedCountry: 'AR',
    },
    filters: { web: true, rating: true },
  },

  'bing-search': {
    id: 'bing-search',
    label: 'Bing Search',
    icon: Telescope,
    group: 'businesses',
    hint: 'Búsqueda mundial + scrape',
    fields: {
      query: {
        placeholder: 'Lo que quieras buscar (ej. "agencias de SEO en Madrid")',
      },
      city: { placeholder: 'Ciudad (opcional)' },
      country: {},
    },
    filters: { web: true },
  },

  'duckduckgo-search': {
    id: 'duckduckgo-search',
    label: 'DuckDuckGo',
    icon: Telescope,
    group: 'businesses',
    hint: 'Búsqueda mundial alt.',
    fields: {
      query: { placeholder: 'Lo que quieras buscar' },
      city: { placeholder: 'Ciudad (opcional)' },
      country: {},
    },
    filters: { web: true },
  },

  clutch: {
    id: 'clutch',
    label: 'Clutch.co',
    icon: BookOpen,
    group: 'businesses',
    hint: 'Directorio global de agencias B2B',
    fields: {
      query: {
        placeholder: 'Vertical de agencia (ej. digital-marketing, web-design)',
        helpText: 'Usa el slug de Clutch — ver clutch.co/agencies para opciones.',
      },
      city: { placeholder: 'Ciudad (opcional)' },
      country: {},
    },
    filters: { web: true },
  },

  workana: {
    id: 'workana',
    label: 'Workana',
    icon: Briefcase,
    group: 'freelance',
    hint: 'Freelancers LatAm · 100% remote',
    fields: {
      query: { placeholder: 'Skill (ej. diseño web, marketing digital)' },
      // Workana es remote-first, no aplica city/country.
    },
    filters: {},
  },

  fiverr: {
    id: 'fiverr',
    label: 'Fiverr',
    icon: Briefcase,
    group: 'freelance',
    hint: 'Freelancers global · servicios',
    fields: {
      query: { placeholder: 'Servicio (ej. logo design, video editing)' },
    },
    filters: {},
  },

  behance: {
    id: 'behance',
    label: 'Behance',
    icon: Network,
    group: 'freelance',
    hint: 'Diseñadores con portafolio',
    fields: {
      query: { placeholder: 'Especialidad (ej. brand design, illustration)' },
    },
    filters: {},
  },

  dribbble: {
    id: 'dribbble',
    label: 'Dribbble',
    icon: Network,
    group: 'freelance',
    hint: 'Diseñadores UI/UX',
    fields: {
      query: { placeholder: 'Skill (ej. ui-designer, illustrator)' },
    },
    filters: {},
  },
};

export const GROUP_LABELS: Record<SourceGroup, string> = {
  businesses: 'Negocios',
  freelance: 'Freelancers',
};

export function getSourcesByGroup(group: SourceGroup): SourceConfig[] {
  return Object.values(SOURCES_CONFIG).filter((s) => s.group === group);
}

export function sourceHasFilter(
  source: Source,
  filter: 'web' | 'rating' | 'operational',
): boolean {
  return Boolean(SOURCES_CONFIG[source].filters[filter]);
}
