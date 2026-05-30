'use client';

import { Plus } from 'lucide-react';

import { Button } from '~/components/ui/button';
import { openNewLeadSheet } from '../../_components/NewLeadSheet';

export function PipelineHeader() {
  return (
    <header className="mb-6 flex items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Pipeline</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Arrastra leads entre etapas. Top 25 por score en cada columna.
        </p>
      </div>
      <Button onClick={openNewLeadSheet}>
        <Plus />
        Nuevo lead
      </Button>
    </header>
  );
}
