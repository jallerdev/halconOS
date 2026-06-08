// Manifest de posts del blog. Fuente única para el index, el sitemap, el
// JSON-LD BlogPosting y la metadata por página. Cuando agregues un post
// nuevo: crea su archivo en `apps/api/src/app/blog/<slug>/page.tsx` y
// añade la entrada aquí.
//
// Reglas SEO (no romperlas):
//   • `slug` es la URL final (`/blog/<slug>`). Kebab-case, sin acentos, ≤60 chars.
//   • `title` ≤ 60 chars (search results truncan).
//   • `description` ≤ 155 chars (meta description).
//   • `keywords` array de long-tail strings que efectivamente buscas posicionar.
//   • `publishedAt` y `updatedAt` ISO date — Google los lee del schema.
//   • `readingMinutes` calculado a ~250 palabras/min, redondeo arriba.

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  excerpt: string;
  publishedAt: string;
  updatedAt?: string;
  readingMinutes: number;
  keywords: string[];
  category: 'Crecimiento' | 'Productividad' | 'Plantillas';
  author: {
    name: string;
    url?: string;
  };
};

export const AUTHOR_DEFAULT = {
  name: 'Equipo HalcónOS',
  url: 'https://jvagencia.com',
} as const;

export const POSTS: BlogPost[] = [
  {
    slug: 'como-conseguir-clientes-agencia-marketing',
    title: 'Cómo conseguir clientes para tu agencia en 2026',
    description:
      'Cinco estrategias probadas para que tu agencia de marketing consiga clientes nuevos sin gastar en ads. Con plantillas y herramientas reales.',
    excerpt:
      'La mayoría de agencias muere por falta de clientes, no por falta de talento. Te muestro cinco formas concretas de conseguir clientes hoy — sin depender de referidos.',
    publishedAt: '2026-06-08',
    readingMinutes: 9,
    keywords: [
      'cómo conseguir clientes para una agencia',
      'clientes para agencia de marketing',
      'agencia de marketing digital',
      'prospección outbound',
      'leads para agencias',
    ],
    category: 'Crecimiento',
    author: AUTHOR_DEFAULT,
  },
  {
    slug: 'errores-comunes-leads-google-maps',
    title: '5 errores comunes al cazar leads en Google Maps',
    description:
      'Si buscas clientes en Google Maps y no estás cerrando ventas, probablemente cometes uno de estos cinco errores. Aprende a evitarlos.',
    excerpt:
      'Google Maps es la mina de oro de leads B2B locales. Pero la mayoría hace lo mismo: copiar nombres en un Excel y mandar el mismo WhatsApp a 50. Te explico por qué no funciona y qué hacer.',
    publishedAt: '2026-06-08',
    readingMinutes: 7,
    keywords: [
      'cómo buscar leads en Google Maps',
      'prospección Google Maps',
      'extraer leads de Google',
      'lead generation local',
      'B2B local prospecting',
    ],
    category: 'Productividad',
    author: AUTHOR_DEFAULT,
  },
  {
    slug: 'plantilla-propuesta-comercial-agencia',
    title: 'Plantilla de propuesta comercial que cierra (con ejemplos)',
    description:
      'La estructura exacta de una propuesta comercial efectiva para agencias: secciones, ejemplos, errores comunes y cómo cerrarla en menos tiempo.',
    excerpt:
      'Una propuesta mal estructurada puede costarte el deal incluso si tienes el mejor pitch. Te paso la plantilla exacta que usamos — más ejemplos de qué SÍ y qué NO escribir en cada sección.',
    publishedAt: '2026-06-08',
    readingMinutes: 8,
    keywords: [
      'plantilla propuesta comercial',
      'propuesta comercial agencia',
      'cómo hacer una propuesta de venta',
      'plantilla cotización servicios',
      'estructura propuesta',
    ],
    category: 'Plantillas',
    author: AUTHOR_DEFAULT,
  },
];

export function findPost(slug: string): BlogPost | undefined {
  return POSTS.find((p) => p.slug === slug);
}
