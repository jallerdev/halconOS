import { expect, test } from '@playwright/test';

// Humo: la app responde y no crashea. Corre SIN credenciales.
// Con Clerk activo y sin sesión, /leads redirige a sign-in; sin Clerk (dev
// bypass) muestra el dashboard. En ambos casos no debe haber error 5xx.
test('la app responde en /leads sin error de servidor', async ({ page }) => {
  const res = await page.goto('/leads');
  expect(res, 'la navegación debe devolver una respuesta').toBeTruthy();
  expect(res!.status(), 'no debe haber error 5xx').toBeLessThan(500);
  await expect(page.locator('body')).toBeVisible();
});
