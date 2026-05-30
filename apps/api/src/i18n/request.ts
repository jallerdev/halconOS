import { getRequestConfig } from 'next-intl/server';

// Setup mínimo sin routing por URL — toda la app vive en es-CO en v1.
// Cuando agreguemos `en` (v1.1), este archivo decidirá el locale leyendo
// una cookie o el header Accept-Language; las claves de messages/ ya están
// estructuradas por feature así que no hace falta refactor.
export const DEFAULT_LOCALE = 'es-CO' as const;

export const SUPPORTED_LOCALES = ['es-CO'] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export default getRequestConfig(async () => {
  const locale: Locale = DEFAULT_LOCALE;
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
