import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  jsonb,
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
  TASK_KIND,
  TASK_PRIORITY,
  TASK_STATUS,
  USER_ROLE,
} from '@halcon-os/shared/enums';

export const agencySchema = pgSchema('agency_os');

export const leadStatusEnum = agencySchema.enum('lead_status', LEAD_STATUS);
export const projectStatusEnum = agencySchema.enum('project_status', PROJECT_STATUS);
export const taskStatusEnum = agencySchema.enum('task_status', TASK_STATUS);
export const taskPriorityEnum = agencySchema.enum('task_priority', TASK_PRIORITY);
export const taskKindEnum = agencySchema.enum('task_kind', TASK_KIND);
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

// API keys para leads entrantes (landing pública). Cada org genera la suya;
// la key (hasheada) identifica a qué org/owner se asignan los leads. El request
// público nunca envía orgId — lo determina la key del lado del servidor.
export const inboundKeys = agencySchema.table(
  'inbound_keys',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: text('org_id').notNull(),
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    keyHash: text('key_hash').notNull(), // sha256 hex del secreto (para lookup en /api/inbound/lead)
    keyPrefix: text('key_prefix').notNull(), // primeros chars, para mostrar en la UI
    // Secreto cifrado AES-256-GCM para que el admin pueda revelarlo después.
    // Nullable: keys legacy creadas antes de esta feature no tienen versión recuperable.
    keyEncrypted: text('key_encrypted'),
    keyEncryptedIv: text('key_encrypted_iv'),
    keyEncryptedTag: text('key_encrypted_tag'),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex('inbound_keys_hash_idx').on(t.keyHash),
    index('inbound_keys_org_idx').on(t.orgId),
  ],
);

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

    // Cuándo el usuario decidió mover este lead del inbox al pipeline kanban.
    // Sólo aplica a leads NEW: si está poblado, el lead aparece en la columna
    // "Por contactar" del kanban; si es null, vive solo en /leads (inbox).
    // Para leads con status != NEW este campo es irrelevante.
    pipelinePromotedAt: timestamp('pipeline_promoted_at', { withTimezone: true }),

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
    // Tipo de "task": una tarea de proyecto tradicional, o una reunión sobre un lead.
    // Regla de app: kind='task' requiere projectId; kind='meeting' requiere leadId.
    kind: taskKindEnum('kind').notNull().default('task'),
    projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }),
    leadId: uuid('lead_id').references(() => leads.id, { onDelete: 'cascade' }),

    title: text('title').notNull(),
    description: text('description'),
    status: taskStatusEnum('status').notNull().default('TODO'),
    priority: taskPriorityEnum('priority').notNull().default('MED'),

    position: integer('position').notNull().default(0),
    dueDate: timestamp('due_date', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),

    // Campos de meeting (Google Calendar + Meet). Nulos cuando kind='task'.
    startsAt: timestamp('starts_at', { withTimezone: true }),
    endsAt: timestamp('ends_at', { withTimezone: true }),
    attendees: text('attendees').array().notNull().default(sql`'{}'::text[]`),
    meetUrl: text('meet_url'),
    googleEventId: text('google_event_id'),
    googleCalendarId: text('google_calendar_id'),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('tasks_project_status_pos_idx').on(t.projectId, t.status, t.position),
    index('tasks_lead_kind_starts_idx').on(t.leadId, t.kind, t.startsAt),
    uniqueIndex('tasks_google_event_idx').on(t.googleEventId),
  ],
);

// Cuenta de Google conectada por usuario (no por org). Permite agendar reuniones
// en su calendario primario y crear enlaces de Meet. El refresh token va cifrado
// AES-256-GCM (ver server/google/crypto.ts).
export const googleAccounts = agencySchema.table('google_accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token').notNull(),
  refreshTokenIv: text('refresh_token_iv').notNull(),
  refreshTokenTag: text('refresh_token_tag').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  scopes: text('scopes').array().notNull().default(sql`'{}'::text[]`),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

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

// Cache global (no per-org) de búsquedas a Google Places API. La key normaliza
// query + ciudad para que distintos usuarios buscando lo mismo reusen el mismo
// resultado (los lugares son objetivos del mundo, no específicos de un org).
// TTL: 24h — el router compara contra createdAt antes de devolver el cache.
export const discoveredPlaces = agencySchema.table(
  'discovered_places',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    searchKey: text('search_key').notNull(),
    results: jsonb('results').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex('discovered_places_key_idx').on(t.searchKey)],
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
  lead: one(leads, { fields: [tasks.leadId], references: [leads.id] }),
}));

export const googleAccountsRelations = relations(googleAccounts, ({ one }) => ({
  user: one(users, { fields: [googleAccounts.userId], references: [users.id] }),
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
export type InboundKey = typeof inboundKeys.$inferSelect;
export type NewInboundKey = typeof inboundKeys.$inferInsert;
export type GoogleAccount = typeof googleAccounts.$inferSelect;
export type NewGoogleAccount = typeof googleAccounts.$inferInsert;
export type DiscoveredPlace = typeof discoveredPlaces.$inferSelect;
export type NewDiscoveredPlace = typeof discoveredPlaces.$inferInsert;
