'use client';

import { Check } from 'lucide-react';

import { LEAD_STATUS, type LeadStatus } from '@halcon-os/shared/enums';
import { LeadStatusBadge } from '~/components/lead-status-badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import { cn } from '~/lib/utils';

// StatusSelect — trigger es el LeadStatusBadge con chevron, content es un
// dropdown con todos los estados y check violet al activo. Las clases del
// dropdown vienen del componente UI restyled (Fase 3) — aquí sólo pintamos
// el badge + check.
export function StatusSelect({
  value,
  onChange,
  disabled,
}: {
  value: LeadStatus;
  onChange: (s: LeadStatus) => void;
  disabled?: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <button
          type="button"
          className={cn(
            'inline-flex items-center transition-opacity hover:opacity-80 focus-visible:outline-none',
            disabled && 'pointer-events-none opacity-60',
          )}
        >
          <LeadStatusBadge status={value} withChevron />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>Cambiar estado</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {LEAD_STATUS.map((s) => (
          <DropdownMenuItem key={s} onClick={() => onChange(s)} className="justify-between gap-3">
            <LeadStatusBadge status={s} />
            {s === value && <Check className="size-3.5 text-[hsl(var(--violet))]" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
