import { clerk, setupClerkTestingToken } from '@clerk/testing/playwright';
import { expect, test } from '@playwright/test';

// RBAC — verifica que un vendedor (org:member) NO ve las acciones de admin.
// Requiere un usuario de prueba org:member con al menos un lead asignado.
// Define en el entorno: E2E_SELLER_EMAIL y E2E_SELLER_PASSWORD (+ Clerk keys).
const SELLER_EMAIL = process.env.E2E_SELLER_EMAIL;
const SELLER_PASSWORD = process.env.E2E_SELLER_PASSWORD;

test.describe('RBAC · restricciones del vendedor (seller)', () => {
  test.skip(
    !SELLER_EMAIL || !SELLER_PASSWORD,
    'Define E2E_SELLER_EMAIL y E2E_SELLER_PASSWORD (usuario org:member con leads asignados) para correr estos tests.',
  );

  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page });
    await page.goto('/');
    await clerk.signIn({
      page,
      signInParams: {
        strategy: 'password',
        identifier: SELLER_EMAIL!,
        password: SELLER_PASSWORD!,
      },
    });
    await page.goto('/leads');
    await page.waitForLoadState('networkidle');
  });

  test('NO ve el botón "Exportar CSV"', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Exportar CSV/i })).toHaveCount(0);
  });

  test('al seleccionar leads, la barra masiva NO ofrece Eliminar ni Asignar', async ({ page }) => {
    const firstCheckbox = page.locator('tbody input[type="checkbox"]').first();
    test.skip((await firstCheckbox.count()) === 0, 'El vendedor no tiene leads asignados para seleccionar.');
    await firstCheckbox.check();
    await expect(page.getByRole('button', { name: /^Eliminar$/ })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Asignar a/i })).toHaveCount(0);
  });

  test('en el detalle del lead, la fila de acciones NO ofrece "Eliminar"', async ({ page }) => {
    const firstRow = page.locator('tbody tr').first();
    test.skip((await firstRow.count()) === 0, 'El vendedor no tiene leads asignados.');
    // El menú de acciones por fila (•••) no debe incluir "Eliminar" para seller.
    const rowMenu = firstRow.getByRole('button').last();
    await rowMenu.click();
    await expect(page.getByRole('menuitem', { name: /Eliminar/i })).toHaveCount(0);
  });
});
