# HalcónOS

Internal Sales OS (CRM + project manager) for a web development agency. Monorepo built with **bun + turbo**, a **Next.js + Drizzle + tRPC** backend and an **Expo + NativeWind** mobile client.

## Structure

```
apps/
  api/      # Next.js 15 + Drizzle + tRPC (deploy: Vercel)
  mobile/   # Expo SDK 54 + Expo Router + NativeWind
packages/
  shared/   # Shared enums + Zod schemas (FE/BE)
  tsconfig/ # base/next/expo tsconfig
```

## Initial setup (one time)

### 1. Install bun

```bash
curl -fsSL https://bun.sh/install | bash
# after installing:
source ~/.bashrc   # or ~/.zshrc
```

### 2. Dependencies

```bash
bun install
```

> The monorepo uses `bunfig.toml` with `linker = "hoisted"` so Expo + Metro work without friction.

### 3. Environment variables

**`apps/api/.env.local`** — copy of `apps/api/.env.example`:

```env
DATABASE_URL="postgres://USER:PASSWORD@HOST:5432/DB?sslmode=require"
DEV_BYPASS_USER_ID="local"   # optional, skips Clerk in dev
```

> Tables live in the `agency_os` schema of your DB, not in `public`. This lets you reuse the same Postgres as other projects without collisions.

**`apps/mobile/.env.local`** — copy of `apps/mobile/.env.example`:

```env
EXPO_PUBLIC_API_URL="http://YOUR_LAN_IP:3000"
```

> On a physical device **do not use `localhost`** — use your machine's IP on the Wi-Fi network (`ip addr` on Linux). On the iOS simulator `http://localhost:3000` does work.

### 4. DB migrations

```bash
bun run db:generate   # generates SQL from schema.ts → drizzle/
bun run db:migrate    # applies migrations against DATABASE_URL
```

## Development

### Run everything at once

```bash
bun run dev   # api + mobile in parallel (turbo)
```

### Or separately

```bash
bun run dev:api      # next dev on :3000
bun run dev:mobile   # expo start
```

### Load the app on your phone

1. Install **Expo Go** on your phone (App Store / Play Store).
2. Phone and laptop on the **same Wi-Fi network**.
3. Start with your LAN IP so the manifest points there:

   ```bash
   REACT_NATIVE_PACKAGER_HOSTNAME=192.168.1.6 bun --filter @halcon-os/mobile dev --host lan
   ```
   Replace `192.168.1.6` with your IP (update it in `apps/mobile/.env.local` too if you want the client to hit the right backend).

4. Scan the QR:
   - **iPhone**: stock camera → tap the banner.
   - **Android**: open Expo Go → "Scan QR".

## Useful scripts

| Command | Action |
|---------|--------|
| `bun run typecheck` | tsc across all workspaces |
| `bun run db:studio` | Web UI to inspect Postgres |
| `bun run db:generate` | Generate a migration from changes in `schema.ts` |
| `bun run db:migrate` | Apply pending migrations |
| `bun --filter @halcon-os/api <script>` | Run a script in a specific workspace |

## Project status

- [x] **Sprint 1** — Foundations: monorepo, schema, tRPC, mobile shell, 3 tabs
- [x] **Sprint 2** — Leads module end-to-end (CRUD, swipe, quick-add, notes, deep-links)
- [x] **Web app** — Dashboard (Next.js + shadcn/ui), AI generation (Gemini), Clerk auth + Organizations, premium landing with light/dark mode
- [ ] **Sprint 3** — Projects + Tasks + Lead → Project conversion
- [ ] **Sprint 4** — Polish, animations, EAS build

## Troubleshooting

**Bundle 500 / "module not found" in Expo Go**: make sure `bunfig.toml` has `linker = "hoisted"` and that you deleted `node_modules/` before reinstalling. Without hoisted, the Expo CLI can't find metro.

**hostUri = 127.0.0.1 instead of your IP**: start with `REACT_NATIVE_PACKAGER_HOSTNAME=YOUR_IP` + `--host lan`.

**Asset errors (icon.png, splash.png)**: they're commented out in `app.config.ts`. When you have the real assets, drop them in `apps/mobile/assets/` and uncomment the refs.
