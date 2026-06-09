import './globals.css';

import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import type { ReactNode } from 'react';

import { ThemeProvider } from '~/components/theme-provider';
import { SITE, SITE_URL } from '~/lib/site';
import { TrpcProvider } from '~/lib/trpc';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE.title,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  authors: [{ name: SITE.publisher.name, url: SITE.publisher.url }],
  creator: SITE.publisher.name,
  publisher: SITE.publisher.name,
  keywords: [
    'CRM',
    'CRM con IA',
    'CRM para agencias',
    'CRM WhatsApp',
    'ventas',
    'leads',
    'propuestas con IA',
    'pipeline de ventas',
    'HalcónOS',
  ],
  alternates: {
    canonical: '/',
    languages: {
      'es-CO': `${SITE_URL}/`,
      'en-US': `${SITE_URL}/en`,
      'x-default': `${SITE_URL}/`,
    },
  },
  openGraph: {
    type: 'website',
    url: SITE_URL,
    siteName: SITE.name,
    title: SITE.title,
    description: SITE.description,
    locale: SITE.locale,
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE.title,
    description: SITE.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} className={`${inter.variable} ${mono.variable}`} suppressHydrationWarning>
      <body className="bg-background font-sans text-foreground antialiased">
        <NextIntlClientProvider messages={messages} locale={locale}>
          <ThemeProvider>
            <TrpcProvider>{children}</TrpcProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
