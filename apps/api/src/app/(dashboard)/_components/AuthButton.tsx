'use client';

import { SignInButton, SignedIn, SignedOut, UserButton, useUser } from '@clerk/nextjs';

const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export function AuthButton({ compact = false }: { compact?: boolean }) {
  if (!clerkEnabled) {
    if (compact) {
      return (
        <div
          className="inline-flex size-9 items-center justify-center rounded-full border border-border/60 bg-secondary/30 text-[10px] text-muted-foreground"
          title="Modo dev · sin auth"
        >
          dev
        </div>
      );
    }
    return (
      <div className="rounded-lg border border-border/60 bg-secondary/30 px-3 py-2 text-xs text-muted-foreground">
        Modo dev · sin auth
      </div>
    );
  }

  return (
    <>
      <SignedIn>{compact ? <CompactRow /> : <SignedInRow />}</SignedIn>
      <SignedOut>
        {compact ? (
          <SignInButton mode="modal">
            <button
              type="button"
              className="inline-flex size-9 items-center justify-center rounded-full border border-border/60 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              aria-label="Iniciar sesión"
            >
              ↪
            </button>
          </SignInButton>
        ) : (
          <SignInButton mode="modal">
            <button className="w-full rounded-lg border border-border/60 px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
              Iniciar sesión
            </button>
          </SignInButton>
        )}
      </SignedOut>
    </>
  );
}

function SignedInRow() {
  const { user } = useUser();
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-secondary/30 px-2 py-2">
      <UserButton afterSignOutUrl="/sign-in" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{user?.fullName ?? 'Cuenta'}</div>
        <div className="truncate text-xs text-muted-foreground">
          {user?.primaryEmailAddress?.emailAddress}
        </div>
      </div>
    </div>
  );
}

function CompactRow() {
  return (
    <div className="flex items-center justify-center">
      <UserButton afterSignOutUrl="/sign-in" />
    </div>
  );
}
