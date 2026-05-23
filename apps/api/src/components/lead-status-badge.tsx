import type { LeadStatus } from '@halcon-os/shared/enums';
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

const TONE: Record<LeadStatus, string> = {
  NEW: 'bg-sky-500/10 text-sky-300 ring-sky-500/20',
  CONTACTED: 'bg-blue-500/10 text-blue-300 ring-blue-500/20',
  QUALIFIED: 'bg-violet-500/10 text-violet-300 ring-violet-500/20',
  PROPOSAL_SENT: 'bg-indigo-500/10 text-indigo-300 ring-indigo-500/20',
  NEGOTIATION: 'bg-amber-500/10 text-amber-300 ring-amber-500/20',
  WON: 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/20',
  LOST: 'bg-rose-500/10 text-rose-300 ring-rose-500/20',
};

const DOT: Record<LeadStatus, string> = {
  NEW: 'bg-sky-400',
  CONTACTED: 'bg-blue-400',
  QUALIFIED: 'bg-violet-400',
  PROPOSAL_SENT: 'bg-indigo-400',
  NEGOTIATION: 'bg-amber-400',
  WON: 'bg-emerald-400',
  LOST: 'bg-rose-400',
};

export const LEAD_STATUS_LABEL = LABEL;

export function LeadStatusBadge({ status, className }: { status: LeadStatus; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
        TONE[status],
        className,
      )}
    >
      <span className={cn('size-1.5 rounded-full', DOT[status])} />
      {LABEL[status]}
    </span>
  );
}
