import { relations } from 'drizzle-orm';
import { organizers } from './organizers.js';
import { sessions } from './sessions.js';
import { questions } from './questions.js';
import { options } from './options.js';
import { votes } from './votes.js';
import { voteCounts } from './voteCounts.js';

// Organizer relations
export const organizersRelations = relations(organizers, ({ many }) => ({
  sessions: many(sessions),
}));

// Session relations
export const sessionsRelations = relations(sessions, ({ one, many }) => ({
  organizer: one(organizers, {
    fields: [sessions.organizerId],
    references: [organizers.id],
  }),
  questions: many(questions),
  votes: many(votes),
  voteCounts: many(voteCounts),
}));

// Question relations
export const questionsRelations = relations(questions, ({ one, many }) => ({
  session: one(sessions, {
    fields: [questions.sessionId],
    references: [sessions.id],
  }),
  options: many(options),
  votes: many(votes),
  voteCounts: many(voteCounts),
}));

// Option relations
export const optionsRelations = relations(options, ({ one, many }) => ({
  question: one(questions, {
    fields: [options.questionId],
    references: [questions.id],
  }),
  votes: many(votes),
  voteCounts: many(voteCounts),
}));

// Vote relations
export const votesRelations = relations(votes, ({ one }) => ({
  session: one(sessions, {
    fields: [votes.sessionId],
    references: [sessions.id],
  }),
  question: one(questions, {
    fields: [votes.questionId],
    references: [questions.id],
  }),
  option: one(options, {
    fields: [votes.optionId],
    references: [options.id],
  }),
}));

// Vote count relations
export const voteCountsRelations = relations(voteCounts, ({ one }) => ({
  session: one(sessions, {
    fields: [voteCounts.sessionId],
    references: [sessions.id],
  }),
  question: one(questions, {
    fields: [voteCounts.questionId],
    references: [questions.id],
  }),
  option: one(options, {
    fields: [voteCounts.optionId],
    references: [options.id],
  }),
}));
