import { orgProcedure, router } from '../trpc';

// Información del usuario actual para el cliente: rol app + permisos
// materializados. Es la fuente única que consume el hook usePermissions para
// ocultar/mostrar acciones en la UI (el server siempre re-valida como red de
// seguridad).
export const viewerRouter = router({
  me: orgProcedure.query(async ({ ctx }) => {
    return {
      userId: ctx.userId,
      orgId: ctx.orgId,
      role: ctx.role,
      permissions: ctx.permissions,
    };
  }),
});
