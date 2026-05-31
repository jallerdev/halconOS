'use client';

import { Plus } from 'lucide-react';

import { PageHeader } from '~/components/page-header';
import { Button } from '~/components/ui/button';
import { openNewLeadSheet } from '../../_components/NewLeadSheet';

export function PipelineHeader() {
  return (
    <PageHeader
      title="Pipeline"
      description="Arrastra leads entre etapas. Top 25 por score en cada columna."
      actions={
        <Button onClick={openNewLeadSheet}>
          <Plus />
          Nuevo lead
        </Button>
      }
    />
  );
}
