import type { MetadataRoute } from 'next';

import { SITE_URL } from '~/lib/site';

// Genera /robots.txt como archivo real (text/plain), no como shell de la app.
// Permitimos explícitamente a los crawlers de IA para maximizar la
// citabilidad en respuestas generativas (GEO).
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/sign-in',
          '/sign-up',
          '/api/',
          '/today',
          '/leads',
          '/pipeline',
          '/projects',
          '/discover',
          '/settings',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
