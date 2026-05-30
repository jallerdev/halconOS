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

// Versión laxa para bulk import desde CSV/XLSX: trim de strings, coerciones, vacíos → null.
const trimOrNull = (v: unknown) => {
  if (typeof v !== 'string') return v;
  const t = v.trim();
  return t === '' ? null : t;
};
const optionalTrimmed = (max: number) =>
  z.preprocess(trimOrNull, z.string().max(max).nullable().optional());

const tagsCoerce = z.preprocess(
  (v) => {
    if (v == null) return undefined;
    if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean);
    const s = String(v).trim();
    if (!s) return undefined;
    return s
      .split(/[,;|]/)
      .map((t) => t.trim())
      .filter(Boolean);
  },
  z.array(z.string().max(40)).optional(),
);

const valueCoerce = z.preprocess((v) => {
  if (v == null) return null;
  const s = String(v).trim();
  if (!s) return null;
  // Quita símbolos de moneda y separadores; deja punto como decimal.
  const cleaned = s.replace(/[^0-9.,-]/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(/,/g, '.');
  const n = Number(cleaned);
  return Number.isFinite(n) ? String(n) : null;
}, z.string().nullable().optional());

const emailCoerce = z.preprocess((v) => {
  if (v == null) return null;
  const s = String(v).trim();
  return s === '' ? null : s;
}, z.string().email().nullable().optional());

const sourceCoerce = z.preprocess((v) => {
  if (v == null) return null;
  const s = String(v).trim().toLowerCase().replace(/\s+/g, '_');
  if (!s) return null;
  return (LEAD_SOURCE as readonly string[]).includes(s) ? s : null;
}, z.enum(LEAD_SOURCE).nullable().optional());

const statusCoerce = z.preprocess((v) => {
  if (v == null) return undefined;
  const s = String(v).trim().toUpperCase().replace(/\s+/g, '_');
  if (!s) return undefined;
  return (LEAD_STATUS as readonly string[]).includes(s) ? s : undefined;
}, z.enum(LEAD_STATUS).optional());

export const bulkImportRowSchema = z.object({
  businessName: z.preprocess(trimOrNull, z.string().min(1).max(200)),
  contactName: optionalTrimmed(120),
  phone: optionalTrimmed(32),
  email: emailCoerce,
  source: sourceCoerce,
  estimatedValue: valueCoerce,
  status: statusCoerce,
  tags: tagsCoerce,
});
export type BulkImportRow = z.infer<typeof bulkImportRowSchema>;

export const bulkImportSchema = z.object({
  rows: z.array(z.unknown()).min(1).max(500),
});
export type BulkImportInput = z.infer<typeof bulkImportSchema>;

export const meetingScheduleSchema = z.object({
  leadId: uuid,
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
  startsAt: z.string().datetime({ offset: true }),
  endsAt: z.string().datetime({ offset: true }),
  attendees: z.array(z.string().email()).max(20).optional(),
  timeZone: z.string().max(80).optional(),
});
export type MeetingScheduleInput = z.infer<typeof meetingScheduleSchema>;

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
