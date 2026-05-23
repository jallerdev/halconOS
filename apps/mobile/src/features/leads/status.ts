import type { LeadStatus } from '@agency-os/shared/enums';

const FORWARD_FLOW: Record<LeadStatus, LeadStatus> = {
  NEW: 'CONTACTED',
  CONTACTED: 'QUALIFIED',
  QUALIFIED: 'PROPOSAL_SENT',
  PROPOSAL_SENT: 'NEGOTIATION',
  NEGOTIATION: 'WON',
  WON: 'WON',
  LOST: 'LOST',
};

export function nextLeadStatus(current: LeadStatus): LeadStatus {
  return FORWARD_FLOW[current];
}

export function isTerminal(status: LeadStatus): boolean {
  return status === 'WON' || status === 'LOST';
}
