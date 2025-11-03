import { pgTable, uuid, integer, timestamp, unique } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { sessions } from './sessions.js';
import { questions } from './questions.js';
import { options } from './options.js';

export const voteCounts = pgTable('vote_counts', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  
  sessionId: uuid('session_id')
    .notNull()
    .references(() => sessions.id, { onDelete: 'cascade' }),
  
  questionId: uuid('question_id')
    .notNull()
    .references(() => questions.id, { onDelete: 'cascade' }),
  
  optionId: uuid('option_id')
    .notNull()
    .references(() => options.id, { onDelete: 'cascade' }),
  
  count: integer('count')
    .notNull()
    .default(0),
  
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
}, (table) => ({
  // Unique constraint per option
  uniqueCount: unique().on(
    table.sessionId,
    table.questionId,
    table.optionId
  ),
}));