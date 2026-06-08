import { clerkSetup } from '@clerk/testing/playwright';
import { test as setup } from '@playwright/test';

// Inicializa los testing tokens de Clerk para evitar el bot-protection en E2E.
// Requiere CLERK_PUBLISHABLE_KEY (o NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) y
// CLERK_SECRET_KEY en el entorno. Sin Clerk configurado, se omite (los specs
// autenticados se saltan solos).
setup('clerk setup', async () => {
  if (!process.env.CLERK_SECRET_KEY) return;
  await clerkSetup();
});
