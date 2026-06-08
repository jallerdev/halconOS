# E2E (Playwright)

Pruebas end-to-end de HalcónOS con Playwright + `@clerk/testing`.

## Correr

```bash
# 1) Smoke (no necesita credenciales): solo verifica que la app responde.
pnpm --filter @halcon-os/api e2e --grep smoke

# 2) Todo (incluye RBAC del vendedor — necesita lo de abajo).
pnpm --filter @halcon-os/api e2e

# Interactivo (UI mode)
pnpm --filter @halcon-os/api e2e:ui
```

Por defecto Playwright levanta la app con `pnpm dev` en `http://localhost:3000`
(o reutiliza la que ya tengas corriendo). Para apuntar a otra URL:
`E2E_BASE_URL=https://staging.tu-dominio.com pnpm --filter @halcon-os/api e2e`.

## Qué necesito de ti para los flujos autenticados (RBAC)

Estos tests no pueden correr sin un entorno real, porque en dev **sin Clerk el
rol siempre es admin**. Para probar el rol vendedor necesito:

1. **Base de datos de prueba** (no producción) — la app apuntando a una Neon de
   dev/staging, con algunos leads.
2. **Clerk en modo test** con sus llaves en el entorno:
   - `CLERK_PUBLISHABLE_KEY` (o `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`)
   - `CLERK_SECRET_KEY`
3. **Un usuario de prueba `org:member`** (vendedor) que ya haya iniciado sesión
   una vez (para que exista su fila en `users`) y con **al menos un lead
   asignado**. Pasa sus credenciales por entorno:
   - `E2E_SELLER_EMAIL`
   - `E2E_SELLER_PASSWORD`
   - (opcional) un `org:admin` análogo: `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD`.

Con eso, `rbac-seller.spec.ts` verifica que el vendedor NO ve Exportar, ni
Eliminar/Asignar (barra masiva y menú por fila). Se irán agregando más casos
(solo-mis-leads, IA sin "landing", etc.) a medida que construyamos.
