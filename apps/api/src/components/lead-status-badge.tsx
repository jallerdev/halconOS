import { ChevronDown } from 'lucide-react';

import type { LeadStatus } from '@halcon-os/shared/enums';
import { STATUS_HUE } from '~/lib/design-tokens';
import { cn } from '~/lib/utils';

const LABEL: Record<LeadStatus, string> = {
  NEW: 'Nuevo',
  CONTACTED: 'Contactado',
  QUALIFIED: 'Calificado',
  PROPOSAL_SENT: 'Propuesta',
  NEGOTIATION: 'Negociación',
  WON: 'Ganado',
  LOST: 'Perdido',
};

export const LEAD_STATUS_LABEL = LABEL;

// LeadStatusBadge — pill con dot + label. Match del handoff: height 24,
// padding 0 10px, rounded-pill, gap 6, dot 6x6.
// Hue desde STATUS_HUE (single source of truth en design-tokens.ts).
export function LeadStatusBadge({
  status,
  withChevron,
  className,
}: {
  status: LeadStatus;
  withChevron?: boolean;
  className?: string;
}) {
  const hue = STATUS_HUE[status];
  return (
    <span
      className={cn(
        'inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 text-[11.5px] font-medium',
        hue.bg,
        hue.text,
        hue.border,
        className,
      )}
    >
      <span className={cn('size-1.5 rounded-full', hue.dot)} />
      {LABEL[status]}
      {withChevron && <ChevronDown className="ml-px size-3 opacity-55" />}
    </span>
  );
}
