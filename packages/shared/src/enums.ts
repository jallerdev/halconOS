export const LEAD_STATUS = [
  'NEW',
  'CONTACTED',
  'QUALIFIED',
  'PROPOSAL_SENT',
  'NEGOTIATION',
  'WON',
  'LOST',
] as const;
export type LeadStatus = (typeof LEAD_STATUS)[number];

export const PROJECT_STATUS = [
  'PLANNING',
  'IN_PROGRESS',
  'REVIEW',
  'DELIVERED',
  'ON_HOLD',
  'CANCELLED',
] as const;
export type ProjectStatus = (typeof PROJECT_STATUS)[number];

export const TASK_STATUS = ['TODO', 'DOING', 'DONE'] as const;
export type TaskStatus = (typeof TASK_STATUS)[number];

export const TASK_PRIORITY = ['LOW', 'MED', 'HIGH', 'URGENT'] as const;
export type TaskPriority = (typeof TASK_PRIORITY)[number];

export const NOTE_PARENT_TYPE = ['lead', 'project'] as const;
export type NoteParentType = (typeof NOTE_PARENT_TYPE)[number];

export const USER_ROLE = ['admin', 'sales'] as const;
export type UserRole = (typeof USER_ROLE)[number];

export const LEAD_SOURCE = [
  'referral',
  'instagram',
  'google',
  'google_maps',
  'walk_in',
  'website',
  'other',
] as const;
export type LeadSource = (typeof LEAD_SOURCE)[number];
