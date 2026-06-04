'use client';

import { KanbanSquare, Loader2, X } from 'lucide-react';

import { Button } from '~/components/ui/button';

type Props = {
  count: number;
  loading: boolean;
  onImport: () => void;
  onClear: () => void;
};

// Barra flotante de bulk-import — aparece cuando hay al menos 1 resultado
// seleccionado. Patrón visual idéntico al de LeadsTable (border violet/30 +
// bg violet/6 + contador + acciones).
export function BulkImportBar({ count, loading, onImport, onClear }: Props) {
  if (count === 0) return null;
  return (
    <div className="sticky top-16 z-10 flex flex-wrap items-center gap-2 rounded-lg border border-[hsl(var(--violet))]/30 bg-[hsl(var(--violet))]/6 px-3 py-2 backdrop-blur-md">
      <span className="text-sm font-medium">
        {count} seleccionado{count === 1 ? '' : 's'}
      </span>
      <div className="mx-1 h-4 w-px bg-border" />
      <Button size="sm" onClick={onImport} disabled={loading}>
        {loading ? <Loader2 className="size-4 animate-spin" /> : <KanbanSquare className="size-4" />}
        Importar al CRM
      </Button>
      <Button size="sm" variant="ghost" onClick={onClear} disabled={loading}>
        <X className="size-4" /> Limpiar
      </Button>
    </div>
  );
}
