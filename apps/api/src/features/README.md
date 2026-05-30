# Features (Feature-Sliced Design)

Convención de organización por **dominio**, no por tipo técnico.

## Estructura por feature

```
features/{nombre}/
├── _components/      # React components privados de la feature
├── _server/          # Drizzle queries + lógica de negocio
├── _types/           # Zod schemas + tipos (compartidos client/server)
├── api.ts            # tRPC router — único export del backend
└── hooks.ts          # React hooks — útil cuando una feature expone múltiples queries
```

## Convenciones

- **Prefijo `_`** = privado de la feature. NO importar `_components/`, `_server/`, `_types/` desde otra feature.
- **`api.ts` y `hooks.ts`** = únicos exports públicos. El resto del repo importa de aquí.
- **Schema Drizzle** vive en `server/db/schema.ts` (única fuente — las FKs cruzan dominios, no se puede trocear).
- **Schemas Zod** viven en `_types/{X}.schema.ts` por feature, reutilizados por tRPC input + react-hook-form.

## Multi-tenant

Toda query que toque datos de org debe pasar por `withTenant()` de `server/db/tenant-context.ts` (o filtrar manualmente por `orgId`). El `orgProcedure` de tRPC inyecta `ctx.orgId + ctx.userId` automáticamente.

## Estado de migración

| Feature | Estado |
|---|---|
| `leads` | Pendiente (mantener `server/routers/leads.ts` por ahora) |
| `meetings` | Pendiente |
| `projects` | Pendiente |
| `tasks` | Pendiente |
| `notes` | Pendiente |
| `inbound-keys` | Pendiente |
| `google-auth` | Pendiente (vive en `app/api/google/` + `server/routers/google.ts`) |

Migración gradual feature por feature. Ambas estructuras coexisten hasta que se complete una feature.

## Integraciones externas (no son features)

| Path | Para qué |
|---|---|
| `server/integrations/google/` | Google Calendar + OAuth client |
| `server/integrations/ai/` | Gemini provider + prompts |
| `server/crypto.ts` | AES-256-GCM + HMAC para refresh tokens e inbound keys |
