import { defineConfig, devices } from '@playwright/test';

// E2E de HalcónOS. Por defecto asume la app en http://localhost:3000 (o la
// levanta con `pnpm dev` si E2E_BASE_URL no está seteada). Los flujos
// autenticados usan @clerk/testing y requieren credenciales de prueba —
// ver e2e/README.md.
const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3000';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    // Inicializa los testing tokens de Clerk antes de los specs autenticados.
    { name: 'setup', testMatch: /global\.setup\.ts/ },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
  ],
  // Si ya tienes la app corriendo en :3000 la reutiliza; si no, la levanta.
  // (La app necesita su .env: base de datos + Clerk. Ver e2e/README.md.)
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: 'pnpm dev',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
