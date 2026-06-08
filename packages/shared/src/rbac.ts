// RBAC — catálogo de permisos, roles predefinidos y helpers.
//
// Compartido entre server (procedures de tRPC) y client (hook usePermissions)
// para que ambos usen EXACTAMENTE el mismo mapa rol→permisos sin duplicar
// lógica. El rol de la app se deriva del orgRole de Clerk (ver roleFromOrgRole);
// el enum legacy `users.role ('admin'|'sales')` NO es la fuente de verdad.
//
// Cómo extender:
//  - Nuevo permiso → agrégalo a PERMISSIONS y a los bundles de rol que lo tengan.
//  - Nuevo rol → agrégalo a APP_ROLES + ROLE_PERMISSIONS y mapea su origen en
//    roleFromOrgRole.
//  - Permisos extra por-usuario (a futuro) → resolvePermissions ya acepta
//    overrides { grant, revoke }; cuando exista la tabla en DB, el server le
//    pasa el resultado del lookup sin tocar las firmas de los procedures.

export const PERMISSIONS = [
  'leads.view.all', // ver leads de toda la org (si no, solo los asignados a uno)
  'leads.edit', // crear / editar / cambiar estado / seguimiento (todos los miembros)
  'leads.delete', // borrar (individual + masivo)
  'leads.assign', // asignar / reasignar leads a miembros
  'leads.export', // exportar CSV
  'leads.convert', // convertir lead → proyecto (RESERVADO: aún no hay endpoint)
  'leads.ai.strategy', // generar IA kind=strategy
  'leads.ai.proposal', // generar IA kind=proposal
  'leads.ai.message', // generar IA kind=message
  'leads.ai.landing', // generar IA kind=landing
  'members.view', // listar miembros de la org (para el selector de asignación)
  'keys.manage', // gestionar API keys de leads entrantes
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const APP_ROLES = ['admin', 'seller'] as const;
export type AppRole = (typeof APP_ROLES)[number];

// admin = todos los permisos.
const ADMIN_PERMS: readonly Permission[] = [...PERMISSIONS];

// seller (vendedor) = solo lo que necesita para vender, acotado a SUS leads.
const SELLER_PERMS: readonly Permission[] = [
  'leads.edit',
  'leads.ai.strategy',
  'leads.ai.proposal',
  'leads.ai.message',
  // NO incluidos a propósito:
  //   leads.view.all  → el seller solo ve sus leads asignados
  //   leads.delete, leads.assign, leads.export, leads.convert
  //   leads.ai.landing
  //   members.view, keys.manage
];

export const ROLE_PERMISSIONS: Record<AppRole, readonly Permission[]> = {
  admin: ADMIN_PERMS,
  seller: SELLER_PERMS,
};

/** Mapea el orgRole de Clerk al rol de la app. */
export function roleFromOrgRole(orgRole?: string | null): AppRole {
  // 'admin' (sin prefijo) cubre el fallback de dev y compat con adminProcedure.
  return orgRole === 'org:admin' || orgRole === 'admin' ? 'admin' : 'seller';
}

/** Chequeo puro de permiso. Usado en server y client. */
export function can(role: AppRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

/**
 * Lista materializada de permisos de un rol, con overrides opcionales por-usuario.
 * Hoy se llama sin overrides; el parámetro existe como punto de extensión.
 */
export function resolvePermissions(
  role: AppRole,
  overrides?: { grant?: Permission[]; revoke?: Permission[] },
): Permission[] {
  const set = new Set<Permission>(ROLE_PERMISSIONS[role]);
  overrides?.grant?.forEach((p) => set.add(p));
  overrides?.revoke?.forEach((p) => set.delete(p));
  return [...set];
}
