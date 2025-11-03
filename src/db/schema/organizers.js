import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const organizers = pgTable('organizers', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  
  email: varchar('email', { length: 255 })
    .notNull()
    .unique(),
  
  passwordHash: varchar('password_hash', { length: 255 })
    .notNull(),
  
  name: varchar('name', { length: 255 })
    .notNull(),
  
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});