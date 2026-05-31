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

// Top bar global del dashboard. Hospeda el toggle de colapsar el sidebar
// (izquierda) y las acciones globales bell + theme + user (derecha).
// Cualquier acción que sea per-page debe ir en el <PageHeader> de esa página,
// no aquí — el top bar es chrome global, no contextual.
export function TopBar() {
  const { collapsed, toggle } = useSidebar();

  return (
    <TooltipProvider delayDuration={200}>
      <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border/60 bg-card/60 px-4 backdrop-blur-xl">
        <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={toggle}
            aria-label={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
            className="inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {collapsed ? 'Expandir' : 'Colapsar'}
        </TooltipContent>
      </Tooltip>

      <div className="flex items-center gap-1">
        <NotificationBell />
        <ThemeToggle />
        {clerkEnabled ? (
          <>
            <SignedIn>
              <div className="ml-1">
                <UserButton afterSignOutUrl="/sign-in" />
              </div>
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <button
                  type="button"
                  className="ml-1 inline-flex h-9 items-center rounded-lg border border-border/60 px-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  Iniciar sesión
                </button>
              </SignInButton>
            </SignedOut>
          </>
        ) : (
          <span
            className="ml-1 inline-flex h-9 items-center rounded-lg border border-border/60 px-3 text-xs text-muted-foreground"
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
