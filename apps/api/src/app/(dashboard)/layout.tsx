import { auth } from '@clerk/nextjs/server';
import type { ReactNode } from 'react';

import { ClerkArea } from '~/components/clerk-area';
import { AppBg } from './_components/AppBg';
import { CommandPalette } from './_components/CommandPalette';
import { EditLeadSheet } from './_components/EditLeadSheet';
import { NewLeadSheet } from './_components/NewLeadSheet';
import { OrgGate } from './_components/OrgGate';
import { ProductTour } from './_components/ProductTour';
import { SidebarProvider } from './_components/sidebar-context';
import { Sidebar } from './_components/Sidebar';
import { TopBar } from './_components/TopBar';

const clerkEnabled = Boolean(process.env.CLERK_SECRET_KEY);

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  // Si Clerk está activo y el usuario no tiene organización activa, mostrar el gate
  // para crear/seleccionar una antes de entrar al dashboard.
  if (clerkEnabled) {
    const { userId, orgId } = await auth();
    if (userId && !orgId) {
      return (
        <ClerkArea>
          <OrgGate />
        </ClerkArea>
      );
    }
  }

  return (
    <ClerkArea>
      <SidebarProvider>
        <AppBg />
        <div className="relative z-[1] flex min-h-screen">
          <Sidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <TopBar />
            <main className="flex-1 overflow-x-hidden">{children}</main>
          </div>
        </div>
        <CommandPalette />
        <NewLeadSheet />
        <EditLeadSheet />
        <ProductTour />
      </SidebarProvider>
    </ClerkArea>
  );
}
