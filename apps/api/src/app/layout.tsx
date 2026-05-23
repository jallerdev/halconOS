import './globals.css';

import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
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

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} ${mono.variable}`} suppressHydrationWarning>
      <body className="bg-background font-sans text-foreground antialiased">
        <ThemeProvider>
          <ClerkThemedProvider enabled={clerkEnabled}>
            <TrpcProvider>{children}</TrpcProvider>
          </ClerkThemedProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
