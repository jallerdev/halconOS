'use client';

import { Check, ChevronDown } from 'lucide-react';

import { LEAD_STATUS, type LeadStatus } from '@agency-os/shared/enums';
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

const LABEL: Record<LeadStatus, string> = {
  NEW: 'Nuevo',
  CONTACTED: 'Contactado',
  QUALIFIED: 'Calificado',
  PROPOSAL_SENT: 'Propuesta enviada',
  NEGOTIATION: 'En negociación',
  WON: 'Ganado',
  LOST: 'Perdido',
};

export function StatusSelect({
  value,
  onChange,
  size = 'sm',
  disabled,
}: {
  value: LeadStatus;
  onChange: (s: LeadStatus) => void;
  size?: 'sm' | 'md';
  disabled?: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <button
          className={cn(
            'group inline-flex items-center gap-1 rounded-full transition-opacity hover:opacity-80 focus-visible:outline-none',
            disabled && 'pointer-events-none opacity-60',
          )}
        >
          <LeadStatusBadge status={value} />
          <ChevronDown className="size-3 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>Cambiar estado</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {LEAD_STATUS.map((s) => (
          <DropdownMenuItem key={s} onClick={() => onChange(s)} className="justify-between">
            <span className="flex items-center gap-2">
              <LeadStatusBadge status={s} />
            </span>
            {s === value && <Check className="size-3.5 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
