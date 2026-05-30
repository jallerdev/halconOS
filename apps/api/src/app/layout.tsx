import './globals.css';

import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import type { ReactNode } from 'react';

import { ClerkThemedProvider } from '~/components/clerk-themed-provider';
import { ThemeProvider } from '~/components/theme-provider';
import { TrpcProvider } from '~/lib/trpc';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: 'Halcón · CRM de ventas',
  description: 'Caza los mejores negocios. Ciérralos con IA. · by JALLER.DEV',
};

const clerkEnabled = Boolean(process.env.CLERK_SECRET_KEY);

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} className={`${inter.variable} ${mono.variable}`} suppressHydrationWarning>
      <body className="bg-background font-sans text-foreground antialiased">
        <NextIntlClientProvider messages={messages} locale={locale}>
          <ThemeProvider>
            <ClerkThemedProvider enabled={clerkEnabled}>
              <TrpcProvider>{children}</TrpcProvider>
            </ClerkThemedProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
