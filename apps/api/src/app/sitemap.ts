import type { MetadataRoute } from 'next';

import { SITE_URL } from '~/lib/site';
import { POSTS } from './blog/posts';

// Genera /sitemap.xml como archivo real (application/xml).
// Solo se listan rutas públicas e indexables (no autenticadas).
//
// Multi-locale: cada URL con versión en inglés se referencia via `alternates.languages`
// para que Google sirva la versión correcta según el idioma del usuario.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    {
      url: `${SITE_URL}/`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1,
      alternates: {
        languages: {
          'es-CO': `${SITE_URL}/`,
          'en-US': `${SITE_URL}/en`,
          'x-default': `${SITE_URL}/`,
        },
      },
    },
    {
      url: `${SITE_URL}/en`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.95,
      alternates: {
        languages: {
          'en-US': `${SITE_URL}/en`,
          'es-CO': `${SITE_URL}/`,
          'x-default': `${SITE_URL}/`,
        },
      },
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    ...POSTS.map((p) => ({
      url: `${SITE_URL}/blog/${p.slug}`,
      lastModified: new Date(p.updatedAt ?? p.publishedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
  ];
}
