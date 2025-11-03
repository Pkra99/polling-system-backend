import { pgTable, uuid, varchar, integer, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { questions } from './questions.js';

export const options = pgTable('options', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  
  questionId: uuid('question_id')
    .notNull()
    .references(() => questions.id, { onDelete: 'cascade' }),
  
  optionText: varchar('option_text', { length: 255 })
    .notNull(),
  
  optionOrder: integer('option_order')
    .notNull()
    .default(0),
  
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});
