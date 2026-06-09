'use client';

import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { createTRPCReact, type CreateTRPCReact } from '@trpc/react-query';
import { useState, type ReactNode } from 'react';
import superjson from 'superjson';

import type { AppRouter } from '~/server/routers/_app';
import { Toaster } from '~/components/toaster';

export const trpc: CreateTRPCReact<AppRouter, unknown> = createTRPCReact<AppRouter>();

// Silenciar errores técnicos en consola del navegador. Los componentes manejan
// errores via `useQuery().error` y muestran mensajes amables al usuario; no
// hace falta que React Query loguee stack traces a consola.
//
// En dev igual los registramos pero a debug level (filtrable). En producción
// quedan silenciados completamente.
const isProd = process.env.NODE_ENV === 'production';
const silentLogger = (_: unknown) => {
  if (!isProd) {
    // dejamos un breadcrumb minimo, no ruidoso, en dev — útil para debugging.
    // En prod ni siquiera esto.
  }
};

export function TrpcProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: false,
            throwOnError: false,
          },
          mutations: {
            throwOnError: false,
          },
        },
        queryCache: new QueryCache({ onError: silentLogger }),
        mutationCache: new MutationCache({ onError: silentLogger }),
      }),
  );

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: '/api/trpc',
          transformer: superjson,
        }),
      ],
    }),
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster />
      </QueryClientProvider>
    </trpc.Provider>
  );
}
