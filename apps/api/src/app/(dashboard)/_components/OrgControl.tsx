'use client';

import { OrganizationSwitcher } from '@clerk/nextjs';

const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

// Workspace switcher al fondo del sidebar. Full-width, marca con gradiente
// violet→teal, popover de Clerk abriéndose HACIA ARRIBA (está pegado al
// piso del viewport). Estilizamos via `appearance.elements` para que se
// fusione con el resto del chrome.
export function OrgControl() {
  if (!clerkEnabled) return null;

  return (
    <OrganizationSwitcher
      hidePersonal
      afterCreateOrganizationUrl="/leads"
      afterSelectOrganizationUrl="/leads"
      afterLeaveOrganizationUrl="/sign-in"
      appearance={{
        elements: {
          rootBox: 'w-full',
          organizationSwitcherTrigger:
            'flex w-full items-center gap-2.5 rounded-[12px] border border-border bg-card-2/40 px-3 py-2.5 text-[12.5px] transition-colors hover:bg-accent/60 hover:border-border-strong',
          organizationSwitcherTriggerIcon: 'text-muted-foreground',
          organizationPreviewMainIdentifier: 'text-foreground font-semibold',
          organizationPreviewSecondaryIdentifier: 'text-muted-foreground',
          organizationPreviewAvatarBox: 'size-6 rounded-[7px]',
          organizationPreviewAvatarImage: 'rounded-[7px]',
          // Popover hacia ARRIBA: el switcher vive al piso del sidebar.
          organizationSwitcherPopoverCard: 'mb-2 shadow-pop',
        },
      }}
    />
  );
}
