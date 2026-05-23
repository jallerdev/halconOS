import { z } from 'zod';
import {
  LEAD_STATUS,
  LEAD_SOURCE,
  PROJECT_STATUS,
  TASK_STATUS,
  TASK_PRIORITY,
  NOTE_PARENT_TYPE,
} from './enums';

const uuid = z.string().uuid();
const isoDate = z.union([z.string().datetime({ offset: true }), z.date()]);
const decimal = z.union([z.string(), z.number()]).transform((v) => String(v));

export const leadCreateSchema = z.object({
  businessName: z.string().min(1).max(200),
  contactName: z.string().max(120).optional().nullable(),
  phone: z.string().max(32).optional().nullable(),
  email: z.string().email().optional().nullable(),
  source: z.enum(LEAD_SOURCE).optional().nullable(),
  estimatedValue: decimal.optional().nullable(),
  status: z.enum(LEAD_STATUS).optional(),
  tags: z.array(z.string().max(40)).optional(),
  nextFollowUpAt: isoDate.optional().nullable(),
});
export type LeadCreateInput = z.infer<typeof leadCreateSchema>;

export const leadUpdateSchema = leadCreateSchema.partial().extend({ id: uuid });
export type LeadUpdateInput = z.infer<typeof leadUpdateSchema>;

export const leadStatusUpdateSchema = z.object({
  id: uuid,
  status: z.enum(LEAD_STATUS),
});

export const leadConvertSchema = z.object({
  leadId: uuid,
  name: z.string().min(1).max(200).optional(),
  amount: decimal,
  startDate: isoDate.optional().nullable(),
  deadline: isoDate,
  description: z.string().max(2000).optional().nullable(),
});
export type LeadConvertInput = z.infer<typeof leadConvertSchema>;

export const projectCreateSchema = z.object({
  leadId: uuid,
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
  amount: decimal,
  status: z.enum(PROJECT_STATUS).optional(),
  startDate: isoDate.optional().nullable(),
  deadline: isoDate.optional().nullable(),
});
export type ProjectCreateInput = z.infer<typeof projectCreateSchema>;

export const projectUpdateSchema = projectCreateSchema.partial().extend({ id: uuid });

export const taskCreateSchema = z.object({
  projectId: uuid,
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
  status: z.enum(TASK_STATUS).optional(),
  priority: z.enum(TASK_PRIORITY).optional(),
  dueDate: isoDate.optional().nullable(),
});
export type TaskCreateInput = z.infer<typeof taskCreateSchema>;

export const taskUpdateSchema = taskCreateSchema.partial().extend({ id: uuid });

export const taskReorderSchema = z.object({
  id: uuid,
  newStatus: z.enum(TASK_STATUS),
  newPosition: z.number().int().min(0),
});

export const noteCreateSchema = z.object({
  parentType: z.enum(NOTE_PARENT_TYPE),
  parentId: uuid,
  body: z.string().min(1).max(4000),
});
export type NoteCreateInput = z.infer<typeof noteCreateSchema>;

export const noteUpdateSchema = z.object({
  id: uuid,
  body: z.string().min(1).max(4000),
});

export const leadSearchSchema = z.object({
  q: z.string().trim().optional(),
  city: z.string().optional(),
  category: z.string().optional(),
  status: z.enum(LEAD_STATUS).optional(),
  hasWebsite: z.boolean().optional(),
  assignedToId: uuid.optional(),
  sort: z.enum(['recent', 'rating', 'reviews', 'name', 'score']).default('recent'),
  limit: z.number().int().min(1).max(100).default(50),
  cursor: z.number().int().min(0).default(0), // offset-based
});
export type LeadSearchInput = z.infer<typeof leadSearchSchema>;

export const AI_KINDS = ['strategy', 'proposal', 'message', 'landing'] as const;
export type AiKind = (typeof AI_KINDS)[number];
export const aiGenerateSchema = z.object({
  id: uuid,
  kind: z.enum(AI_KINDS),
});

export const bulkStatusSchema = z.object({
  ids: z.array(uuid).min(1).max(500),
  status: z.enum(LEAD_STATUS),
});
export const bulkIdsSchema = z.object({
  ids: z.array(uuid).min(1).max(500),
});

export const idSchema = z.object({ id: uuid });
export const parentRefSchema = z.object({
  parentType: z.enum(NOTE_PARENT_TYPE),
  parentId: uuid,
});
