import { pgTable, uuid, text, integer, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { sessions } from './sessions.js';

export const questions = pgTable('questions', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  
  sessionId: uuid('session_id')
    .notNull()
    .references(() => sessions.id, { onDelete: 'cascade' }),
  
  questionText: text('question_text')
    .notNull(),
  
  questionOrder: integer('question_order')
    .notNull()
    .default(0),
  
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});