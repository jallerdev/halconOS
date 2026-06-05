// Configuración canónica del sitio público. Fuente única para metadata,
// robots, sitemap, JSON-LD y Open Graph.

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://halcon.jvagencia.com'
).replace(/\/$/, '');

export const SITE = {
  name: 'HalcónOS',
  shortName: 'Halcón',
  url: SITE_URL,
  locale: 'es_CO',
  title: 'HalcónOS — CRM de ventas con IA para agencias',
  description:
    'Caza leads con Google, redacta propuestas con IA y unifica WhatsApp, email y pipeline en un solo lugar. El CRM de ventas para agencias en LatAm.',
  tagline: 'Caza los mejores negocios. Ciérralos con IA.',
  publisher: {
    name: 'JALLER.DEV',
    url: 'https://jvagencia.com',
  },
} as const;
