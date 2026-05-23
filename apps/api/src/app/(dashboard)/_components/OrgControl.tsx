'use client';

import { OrganizationSwitcher } from '@clerk/nextjs';

const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export function OrgControl() {
  if (!clerkEnabled) return null;

  return (
    <div className="rounded-lg border border-border/60 bg-secondary/30 p-1">
      <OrganizationSwitcher
        hidePersonal
        afterCreateOrganizationUrl="/leads"
        afterSelectOrganizationUrl="/leads"
        afterLeaveOrganizationUrl="/sign-in"
        appearance={{
          elements: {
            rootBox: 'w-full',
            organizationSwitcherTrigger: 'w-full justify-between px-2 py-1.5 text-sm',
          },
        }}
      />
    </div>
  );
}
