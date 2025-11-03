import { pgTable, uuid, varchar, timestamp, unique } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { sessions } from './sessions.js';
import { questions } from './questions.js';
import { options } from './options.js';

export const votes = pgTable('votes', {
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
  
  participantFingerprint: varchar('participant_fingerprint', { length: 64 })
    .notNull(),
  
  votedAt: timestamp('voted_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (table) => ({
  // Composite unique constraint to prevent duplicate votes
  uniqueVote: unique().on(
    table.sessionId,
    table.questionId,
    table.participantFingerprint
  ),
}));