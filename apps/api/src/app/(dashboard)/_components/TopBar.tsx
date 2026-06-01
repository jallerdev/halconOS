'use client';

import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';

import { ThemeToggle } from '~/components/theme-toggle';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '~/components/ui/tooltip';
import { NotificationBell } from './NotificationBell';
import { useSidebar } from './sidebar-context';

const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

// Top bar global del dashboard (56px, sticky, glass).
// Izquierda: toggle del sidebar. Derecha: bell + theme + divisor + avatar/user.
// Cualquier acción per-page va en el <PageHeader> de la página, NO acá:
// el top bar es chrome global, no contextual.
export function TopBar() {
  const { collapsed, toggle } = useSidebar();

  return (
    <TooltipProvider delayDuration={200}>
      <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border bg-card/60 px-[18px] backdrop-blur-xl">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={toggle}
              aria-label={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
              className="hx-press inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {collapsed ? <PanelLeftOpen className="size-[18px]" /> : <PanelLeftClose className="size-[18px]" />}
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {collapsed ? 'Expandir' : 'Colapsar'}
          </TooltipContent>
        </Tooltip>

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
