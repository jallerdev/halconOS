'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import { useTheme } from 'next-themes';
import type { ReactNode } from 'react';

export function ClerkThemedProvider({
  enabled,
  children,
}: {
  enabled: boolean;
  children: ReactNode;
}) {
  const { resolvedTheme } = useTheme();

  if (!enabled) return <>{children}</>;

  return (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      appearance={{
        baseTheme: resolvedTheme === 'dark' ? dark : undefined,
        variables: { colorPrimary: '#7C5CFF' },
      }}
    >
      {children}
    </ClerkProvider>
  );
}
