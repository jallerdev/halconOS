import type { ReactNode } from 'react';

import { cn } from '~/lib/utils';

type PageHeaderProps = {
  // Eyebrow opcional — pinta arriba del título con gradiente violet→teal.
  // Úsalo para contextualizar la página ("PIPELINE DE VENTAS", "ESTA SEMANA",
  // etc.); deja vacío si el título ya es claro por sí solo.
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
};

// Header estándar de cada página del dashboard. Mantiene la jerarquía
// tipográfica idéntica (eyebrow + h1 + subtítulo) y un slot opcional para
// acciones a la derecha. Tipografía "Atrevida": h1 text-3xl semibold
// tracking-tighter, peso 700.
//
// Usar SIEMPRE en lugar de un <header> ad-hoc.
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        'mb-7 flex flex-wrap items-start justify-between gap-4',
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow && <span className="hx-eyebrow">{eyebrow}</span>}
        <h1 className="text-[30px] font-bold leading-[1.1] tracking-[-0.025em]">{title}</h1>
        {description && (
          <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}
