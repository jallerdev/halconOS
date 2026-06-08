import { describe, expect, it } from 'vitest';

import {
  APP_ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  can,
  resolvePermissions,
  roleFromOrgRole,
  type Permission,
} from './rbac';

// Permisos que el vendedor (seller) SÍ debe tener.
const SELLER_ALLOWED: Permission[] = [
  'leads.edit',
  'leads.ai.strategy',
  'leads.ai.proposal',
  'leads.ai.message',
];

// Permisos que el vendedor NO debe tener (least-privilege).
const SELLER_DENIED: Permission[] = [
  'leads.view.all',
  'leads.delete',
  'leads.assign',
  'leads.export',
  'leads.convert',
  'leads.ai.landing',
  'members.view',
  'keys.manage',
];

describe('roleFromOrgRole', () => {
  it('mapea org:admin de Clerk a admin', () => {
    expect(roleFromOrgRole('org:admin')).toBe('admin');
  });

  it('acepta "admin" sin prefijo (fallback de dev / compat)', () => {
    expect(roleFromOrgRole('admin')).toBe('admin');
  });

  it('mapea org:member a seller', () => {
    expect(roleFromOrgRole('org:member')).toBe('seller');
  });

  it('trata null / undefined como seller (por defecto, sin privilegios)', () => {
    expect(roleFromOrgRole(null)).toBe('seller');
    expect(roleFromOrgRole(undefined)).toBe('seller');
  });

  it('trata cualquier rol desconocido como seller', () => {
    expect(roleFromOrgRole('org:billing_manager')).toBe('seller');
    expect(roleFromOrgRole('')).toBe('seller');
  });

  it('solo devuelve roles declarados en APP_ROLES', () => {
    for (const orgRole of ['org:admin', 'admin', 'org:member', 'cualquiera', null, undefined]) {
      expect(APP_ROLES).toContain(roleFromOrgRole(orgRole));
    }
  });
});

describe('ROLE_PERMISSIONS bundles', () => {
  it('admin tiene TODOS los permisos del catálogo', () => {
    for (const p of PERMISSIONS) {
      expect(ROLE_PERMISSIONS.admin).toContain(p);
    }
    expect(ROLE_PERMISSIONS.admin).toHaveLength(PERMISSIONS.length);
  });

  it('seller tiene exactamente los permisos permitidos (ni más ni menos)', () => {
    expect([...ROLE_PERMISSIONS.seller].sort()).toEqual([...SELLER_ALLOWED].sort());
  });

  it('seller NO incluye ningún permiso denegado', () => {
    for (const p of SELLER_DENIED) {
      expect(ROLE_PERMISSIONS.seller).not.toContain(p);
    }
  });

  it('todo permiso de un rol existe en el catálogo PERMISSIONS', () => {
    for (const role of APP_ROLES) {
      for (const p of ROLE_PERMISSIONS[role]) {
        expect(PERMISSIONS).toContain(p);
      }
    }
  });
});

describe('can', () => {
  it('admin puede todo', () => {
    for (const p of PERMISSIONS) {
      expect(can('admin', p)).toBe(true);
    }
  });

  it('seller puede sus acciones de venta', () => {
    for (const p of SELLER_ALLOWED) {
      expect(can('seller', p)).toBe(true);
    }
  });

  it('seller NO puede borrar, exportar, asignar, ver todo, convertir, ni IA landing', () => {
    for (const p of SELLER_DENIED) {
      expect(can('seller', p)).toBe(false);
    }
  });

  it('seller no ve todos los leads (solo asignados) pero sí puede editar', () => {
    expect(can('seller', 'leads.view.all')).toBe(false);
    expect(can('seller', 'leads.edit')).toBe(true);
  });

  it('IA: seller tiene strategy/proposal/message pero NO landing', () => {
    expect(can('seller', 'leads.ai.strategy')).toBe(true);
    expect(can('seller', 'leads.ai.proposal')).toBe(true);
    expect(can('seller', 'leads.ai.message')).toBe(true);
    expect(can('seller', 'leads.ai.landing')).toBe(false);
  });
});

describe('resolvePermissions', () => {
  it('sin overrides devuelve el bundle del rol', () => {
    expect([...resolvePermissions('seller')].sort()).toEqual([...ROLE_PERMISSIONS.seller].sort());
    expect(resolvePermissions('admin')).toHaveLength(PERMISSIONS.length);
  });

  it('grant agrega permisos extra al seller', () => {
    const perms = resolvePermissions('seller', { grant: ['leads.export'] });
    expect(perms).toContain('leads.export');
    // No pierde los que ya tenía.
    expect(perms).toContain('leads.edit');
  });

  it('revoke quita permisos del rol', () => {
    const perms = resolvePermissions('seller', { revoke: ['leads.edit'] });
    expect(perms).not.toContain('leads.edit');
  });

  it('grant + revoke se aplican ambos', () => {
    const perms = resolvePermissions('seller', {
      grant: ['leads.delete'],
      revoke: ['leads.ai.proposal'],
    });
    expect(perms).toContain('leads.delete');
    expect(perms).not.toContain('leads.ai.proposal');
  });

  it('revoke de un permiso que no estaba es un no-op (no lanza)', () => {
    expect(() => resolvePermissions('seller', { revoke: ['keys.manage'] })).not.toThrow();
    expect(resolvePermissions('seller', { revoke: ['keys.manage'] })).not.toContain('keys.manage');
  });

  it('grant duplicado no genera permisos repetidos', () => {
    const perms = resolvePermissions('seller', { grant: ['leads.edit', 'leads.edit'] });
    expect(perms.filter((p) => p === 'leads.edit')).toHaveLength(1);
  });

  it('no muta el bundle original del rol', () => {
    const before = [...ROLE_PERMISSIONS.seller];
    resolvePermissions('seller', { grant: ['leads.delete'], revoke: ['leads.edit'] });
    expect([...ROLE_PERMISSIONS.seller]).toEqual(before);
  });
});
