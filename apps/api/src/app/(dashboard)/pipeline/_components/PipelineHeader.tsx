'use client';

import { Plus } from 'lucide-react';

import { PageHeader } from '~/components/page-header';
import { Button } from '~/components/ui/button';
import { openNewLeadSheet } from '../../_components/NewLeadSheet';

export function PipelineHeader() {
  return (
    <PageHeader
      eyebrow="Kanban"
      title="Pipeline"
      description="Arrastra leads entre etapas · top por score en cada columna."
      actions={
        <Button onClick={openNewLeadSheet} className="hx-btn-shine hx-press">
          <Plus />
          Nuevo lead
        </Button>
      }
    />
  );
}
