import type { ReactNode } from 'react';

import { ClerkThemedProvider } from './clerk-themed-provider';

// Monta Clerk SOLO en las áreas que lo necesitan (dashboard + auth). El landing
// público NO lo carga, evitando ~187 KiB de JS de Clerk en la ruta crítica.
// El preconnect vive aquí (no en el root) para que solo se emita donde el SDK
// de Clerk realmente se descarga.
const clerkEnabled = Boolean(process.env.CLERK_SECRET_KEY);

export function ClerkArea({ children }: { children: ReactNode }) {
  if (!clerkEnabled) return <>{children}</>;

  return (
    <>
      <link rel="preconnect" href="https://clerk.halcon.jvagencia.com" crossOrigin="anonymous" />
      <link rel="dns-prefetch" href="https://clerk.halcon.jvagencia.com" />
      <ClerkThemedProvider enabled>{children}</ClerkThemedProvider>
    </>
  );
}
