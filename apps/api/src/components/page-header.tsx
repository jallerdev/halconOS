import type { ReactNode } from 'react';

import { cn } from '~/lib/utils';

type PageHeaderProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
};

// Header estándar de cada página del dashboard. Mantiene la jerarquía
// tipográfica idéntica (h1 + subtítulo) y un slot opcional para acciones
// a la derecha (botones primarios como "Nuevo lead", "Importar", etc.).
// Usar SIEMPRE en lugar de un <header> ad-hoc.
export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <header
      className={cn('mb-6 flex flex-wrap items-start justify-between gap-3', className)}
    >
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}
