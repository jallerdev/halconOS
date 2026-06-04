'use client';

import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';

import { ThemeToggle } from '~/components/theme-toggle';
import { TooltipProvider } from '~/components/ui/tooltip';
import { NotificationBell } from './NotificationBell';

const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

// Top bar global del dashboard (56px, sticky, glass).
// Derecha: bell + theme + divisor + avatar/user. El toggle del sidebar vive
// ahora EN el sidebar (sobre el logo HalcónOS, estilo Gemini) — no acá.
// Cualquier acción per-page va en el <PageHeader> de la página, NO acá:
// el top bar es chrome global, no contextual.
export function TopBar() {
  return (
    <TooltipProvider delayDuration={200}>
      <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-end gap-3 border-b border-border bg-background/95 px-[18px] backdrop-blur-xl supports-[backdrop-filter]:bg-background/80">
        <div className="flex items-center gap-1">
          <NotificationBell />
          <ThemeToggle />
          <span aria-hidden className="mx-1.5 h-[22px] w-px bg-border" />
          {clerkEnabled ? (
            <>
              <SignedIn>
                <UserButton afterSignOutUrl="/sign-in" />
              </SignedIn>
              <SignedOut>
                <SignInButton mode="modal">
                  <button
                    type="button"
                    className="hx-press inline-flex h-9 items-center rounded-lg border border-border px-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  >
                    Iniciar sesión
                  </button>
                </SignInButton>
              </SignedOut>
            </>
          ) : (
            <span
              className="inline-flex h-9 items-center rounded-lg border border-border px-3 text-xs text-muted-foreground"
              title="Modo dev · sin auth"
            >
              dev
            </span>
          )}
        </div>
      </header>
    </TooltipProvider>
  );
}
