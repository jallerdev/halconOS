import type { MetadataRoute } from 'next';

import { SITE_URL } from '~/lib/site';

// Genera /sitemap.xml como archivo real (application/xml).
// Solo se listan rutas públicas e indexables (no autenticadas).
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${SITE_URL}/`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
  ];
}
