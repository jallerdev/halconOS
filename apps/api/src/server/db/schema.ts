import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  numeric,
  pgSchema,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import {
  LEAD_STATUS,
  NOTE_PARENT_TYPE,
  PROJECT_STATUS,
  TASK_PRIORITY,
  TASK_STATUS,
  USER_ROLE,
} from '@agency-os/shared/enums';

export const agencySchema = pgSchema('agency_os');

export const leadStatusEnum = agencySchema.enum('lead_status', LEAD_STATUS);
export const projectStatusEnum = agencySchema.enum('project_status', PROJECT_STATUS);
export const taskStatusEnum = agencySchema.enum('task_status', TASK_STATUS);
export const taskPriorityEnum = agencySchema.enum('task_priority', TASK_PRIORITY);
export const noteParentTypeEnum = agencySchema.enum('note_parent_type', NOTE_PARENT_TYPE);
export const userRoleEnum = agencySchema.enum('user_role', USER_ROLE);

export const users = agencySchema.table('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  externalId: text('external_id').unique(), // Clerk user id
  role: userRoleEnum('role').notNull().default('sales'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const leads = agencySchema.table(
  'leads',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: text('org_id'), // Clerk organization id (multi-tenant scope)
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    assignedToId: uuid('assigned_to_id').references(() => users.id, {
      onDelete: 'set null',
    }),

    businessName: text('business_name').notNull(),
    contactName: text('contact_name'),
    phone: text('phone'),
    phoneIntl: text('phone_intl'),
    email: text('email'),
    source: text('source'),
    estimatedValue: numeric('estimated_value', { precision: 12, scale: 2 }),

    status: leadStatusEnum('status').notNull().default('NEW'),
    tags: text('tags').array().notNull().default(sql`'{}'::text[]`),

    // --- Google Places / scraping enrichment ---
    category: text('category'), // sector de negocio (barbería, veterinaria…)
    city: text('city'),
    address: text('address'),
    googleRating: numeric('google_rating', { precision: 3, scale: 2 }),
    reviewCount: integer('review_count'),
    hasWebsite: boolean('has_website'),
    websiteUrl: text('website_url'),
    priceLevel: text('price_level'),
    businessStatus: text('business_status'),
    placeId: text('place_id'),
    placeTypes: text('place_types').array().notNull().default(sql`'{}'::text[]`),
    mapsUrl: text('maps_url'),
    latitude: numeric('latitude', { precision: 10, scale: 7 }),
    longitude: numeric('longitude', { precision: 10, scale: 7 }),
    scrapedAt: timestamp('scraped_at', { withTimezone: true }),

    // --- AI sales content (generado con Gemini) ---
    aiSalesAngle: text('ai_sales_angle'),
    aiPainPoints: text('ai_pain_points'),
    aiSuggestedPage: text('ai_suggested_page'),
    aiProposal: text('ai_proposal'),
    aiFirstMessage: text('ai_first_message'),
    aiLandingCopy: text('ai_landing_copy'),
    aiGeneratedAt: timestamp('ai_generated_at', { withTimezone: true }),

    nextFollowUpAt: timestamp('next_follow_up_at', { withTimezone: true }),
    lastContactedAt: timestamp('last_contacted_at', { withTimezone: true }),

    projectId: uuid('project_id'),
    convertedAt: timestamp('converted_at', { withTimezone: true }),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('leads_org_status_idx').on(t.orgId, t.status),
    index('leads_follow_up_idx').on(t.nextFollowUpAt),
    index('leads_city_category_idx').on(t.city, t.category),
    uniqueIndex('leads_org_place_idx').on(t.orgId, t.placeId),
  ],
);

export const projects = agencySchema.table(
  'projects',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: text('org_id'),
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    leadId: uuid('lead_id')
      .notNull()
      .references(() => leads.id, { onDelete: 'restrict' }),

    name: text('name').notNull(),
    description: text('description'),
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),

    status: projectStatusEnum('status').notNull().default('PLANNING'),

    startDate: timestamp('start_date', { withTimezone: true }),
    deadline: timestamp('deadline', { withTimezone: true }),
    deliveredAt: timestamp('delivered_at', { withTimezone: true }),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('projects_org_status_idx').on(t.orgId, t.status),
    uniqueIndex('projects_lead_unique_idx').on(t.leadId),
  ],
);

export const tasks = agencySchema.table(
  'tasks',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: text('org_id'),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),

    title: text('title').notNull(),
    description: text('description'),
    status: taskStatusEnum('status').notNull().default('TODO'),
    priority: taskPriorityEnum('priority').notNull().default('MED'),

    position: integer('position').notNull().default(0),
    dueDate: timestamp('due_date', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('tasks_project_status_pos_idx').on(t.projectId, t.status, t.position),
  ],
);

export const notes = agencySchema.table(
  'notes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: text('org_id'),
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    parentType: noteParentTypeEnum('parent_type').notNull(),
    parentId: uuid('parent_id').notNull(),

    body: text('body').notNull(),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('notes_parent_idx').on(t.parentType, t.parentId),
  ],
);

export const usersRelations = relations(users, ({ many }) => ({
  leads: many(leads),
  projects: many(projects),
  notes: many(notes),
}));

export const leadsRelations = relations(leads, ({ one, many }) => ({
  owner: one(users, { fields: [leads.ownerId], references: [users.id] }),
  project: one(projects, { fields: [leads.projectId], references: [projects.id] }),
  notes: many(notes),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  owner: one(users, { fields: [projects.ownerId], references: [users.id] }),
  lead: one(leads, { fields: [projects.leadId], references: [leads.id] }),
  tasks: many(tasks),
  notes: many(notes),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  project: one(projects, { fields: [tasks.projectId], references: [projects.id] }),
}));

export const notesRelations = relations(notes, ({ one }) => ({
  owner: one(users, { fields: [notes.ownerId], references: [users.id] }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;
