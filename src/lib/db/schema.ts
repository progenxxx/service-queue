import { pgTable, text, timestamp, integer, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';

export const userRoleEnum = pgEnum('user_role', ['customer', 'customer_admin', 'agent', 'super_admin']);
export const taskStatusEnum = pgEnum('task_status', ['new', 'open', 'in_progress', 'closed']);
export const serviceQueueCategoryEnum = pgEnum('service_queue_category', [
  'policy_inquiry',
  'claims_processing', 
  'account_update',
  'technical_support',
  'billing_inquiry',
  'other'
]);

export const companies = pgTable('companies', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  companyName: text('company_name').notNull(),
  primaryContact: text('primary_contact').notNull(),
  phone: text('phone'),
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const users = pgTable('users', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email').notNull().unique(),
  loginCode: text('login_code').unique(),
  passwordHash: text('password_hash'),
  role: userRoleEnum('role').notNull(),
  companyId: text('company_id').references(() => companies.id),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const agents = pgTable('agents', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').references(() => users.id).notNull().unique(),
  assignedCompanyIds: text('assigned_company_ids').array(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const serviceRequests = pgTable('service_requests', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  serviceQueueId: text('service_queue_id').notNull().unique(),
  client: text('client').notNull(),
  companyId: text('company_id').references(() => companies.id).notNull(),
  taskStatus: taskStatusEnum('task_status').default('new').notNull(),
  serviceRequestNarrative: text('service_request_narrative').notNull(),
  serviceQueueCategory: serviceQueueCategoryEnum('service_queue_category').notNull(),
  assignedToId: text('assigned_to_id').references(() => users.id),
  assignedById: text('assigned_by_id').references(() => users.id).notNull(),
  dueDate: timestamp('due_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  modifiedById: text('modified_by_id').references(() => users.id),
});

export const requestNotes = pgTable('request_notes', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  requestId: text('request_id').references(() => serviceRequests.id).notNull(),
  authorId: text('author_id').references(() => users.id).notNull(),
  noteContent: text('note_content').notNull(),
  isInternal: boolean('is_internal').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const requestAttachments = pgTable('request_attachments', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  requestId: text('request_id').references(() => serviceRequests.id).notNull(),
  fileName: text('file_name').notNull(),
  filePath: text('file_path').notNull(),
  fileSize: integer('file_size').notNull(),
  mimeType: text('mime_type').notNull(),
  uploadedById: text('uploaded_by_id').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});