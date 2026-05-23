'use client';

import { CreateOrganization, OrganizationList, useOrganizationList } from '@clerk/nextjs';

import { Wordmark } from '~/components/wordmark';

export function OrgGate() {
  // Si el usuario ya pertenece a alguna org, mostrar el selector; si no, crear una.
  const { userMemberships, isLoaded } = useOrganizationList({
    userMemberships: { infinite: true },
  });

  const hasOrgs = isLoaded && (userMemberships?.count ?? 0) > 0;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-4">
      <div className="text-center">
        <Wordmark className="justify-center" logoClassName="size-8" textClassName="text-2xl" />
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          {hasOrgs
            ? 'Selecciona tu organización para continuar.'
            : 'Crea tu organización (tu agencia) para empezar. Tú serás el administrador y podrás invitar a tu equipo.'}
        </p>
      </div>

      {hasOrgs ? (
        <OrganizationList
          hidePersonal
          afterSelectOrganizationUrl="/leads"
          afterCreateOrganizationUrl="/leads"
        />
      ) : (
        <CreateOrganization afterCreateOrganizationUrl="/leads" skipInvitationScreen={false} />
      )}
    </div>
  );
}
