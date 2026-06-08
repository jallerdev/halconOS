'use client';

import type { AppRole, Permission } from '@halcon-os/shared/rbac';
import { trpc } from '~/lib/trpc';

// Permisos del usuario actual para gatear la UI. Lee viewer.me (fuente única,
// resuelta server-side). La UI oculta proactivamente; el server re-valida cada
// acción como red de seguridad (defense in depth).
export function usePermissions() {
  const { data, isLoading } = trpc.viewer.me.useQuery(undefined, {
    staleTime: 5 * 60_000,
  });
  const permissions = data?.permissions ?? [];
  return {
    isLoading,
    role: (data?.role ?? 'seller') as AppRole,
    isAdmin: data?.role === 'admin',
    can: (p: Permission) => permissions.includes(p),
  };
}
