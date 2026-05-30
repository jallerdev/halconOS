import { db } from './index';

export type TenantCtx = {
  orgId: string;
  userId: string;
};

// Wrapper para queries con scope de organización. Todo Drizzle query que toque
// datos multi-tenant DEBE pasar por aquí (o filtrar manualmente por orgId en
// el WHERE). Centralizar el patrón nos da un solo lugar para auditar el
// aislamiento entre orgs y, en el futuro, activar Postgres RLS con un solo
// cambio (SET LOCAL app.org_id = ...).
//
// Uso:
//   await withTenant(ctx, async (tx) => {
//     return tx.select().from(leads).where(eq(leads.orgId, ctx.orgId));
//   });
export async function withTenant<T>(
  ctx: TenantCtx,
  fn: (tx: typeof db) => Promise<T>,
): Promise<T> {
  return fn(db);
}
