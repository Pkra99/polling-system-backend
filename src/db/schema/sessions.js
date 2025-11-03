import { pgTable, uuid, varchar, text, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { organizers } from './organizers.js';

// Define session status enum
export const sessionStatusEnum = pgEnum('session_status', [
  'draft',
  'active',
  'stopped',
  'closed'
]);

export const sessions = pgTable('sessions', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  
  organizerId: uuid('organizer_id')
    .notNull()
    .references(() => organizers.id, { onDelete: 'cascade' }),
  
  title: varchar('title', { length: 255 })
    .notNull(),
  
  description: text('description'),
  
  joinCode: varchar('join_code', { length: 8 })
    .notNull()
    .unique(),
  
  status: sessionStatusEnum('status')
    .notNull()
    .default('draft'),
  
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});