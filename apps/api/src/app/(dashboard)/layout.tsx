import { auth } from '@clerk/nextjs/server';
import type { ReactNode } from 'react';

import { CommandPalette } from './_components/CommandPalette';
import { NewLeadSheet } from './_components/NewLeadSheet';
import { OrgGate } from './_components/OrgGate';
import { Sidebar } from './_components/Sidebar';

const clerkEnabled = Boolean(process.env.CLERK_SECRET_KEY);

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  // Si Clerk está activo y el usuario no tiene organización activa, mostrar el gate
  // para crear/seleccionar una antes de entrar al dashboard.
  if (clerkEnabled) {
    const { userId, orgId } = await auth();
    if (userId && !orgId) {
      return <OrgGate />;
    }
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-x-hidden">{children}</main>
      <CommandPalette />
      <NewLeadSheet />
    </div>
  );
}
