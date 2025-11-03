import { eq, and, sql } from 'drizzle-orm';
import { db } from '../config/database.js';
import { voteCounts } from '../db/schema/index.js';

export const voteCountRepository = {
  /**
   * Initialize vote counts for a session's options
   */
  async initializeForSession(sessionId, questionId, optionIds) {
    const data = optionIds.map(optionId => ({
      sessionId,
      questionId,
      optionId,
      count: 0,
    }));

    try {
      await db
        .insert(voteCounts)
        .values(data)
        .onConflictDoNothing();
    } catch (error) {
      // Ignore if already exists
      if (error.code !== '23505') {
        throw error;
      }
    }
  },

  /**
   * Increment vote count for an option
   */
  async increment(sessionId, questionId, optionId) {
    const [result] = await db
      .insert(voteCounts)
      .values({
        sessionId,
        questionId,
        optionId,
        count: 1,
      })
      .onConflictDoUpdate({
        target: [voteCounts.sessionId, voteCounts.questionId, voteCounts.optionId],
        set: {
          count: sql`${voteCounts.count} + 1`,
          updatedAt: new Date(),
        },
      })
      .returning();
    
    return result;
  },

  /**
   * Get vote counts for a session
   */
  async findBySession(sessionId) {
    return await db
      .select()
      .from(voteCounts)
      .where(eq(voteCounts.sessionId, sessionId));
  },

  /**
   * Get vote counts for a question
   */
  async findByQuestion(questionId) {
    return await db
      .select()
      .from(voteCounts)
      .where(eq(voteCounts.questionId, questionId));
  },

  /**
   * Get vote count for a specific option
   */
  async findByOption(sessionId, questionId, optionId) {
    const [result] = await db
      .select()
      .from(voteCounts)
      .where(
        and(
          eq(voteCounts.sessionId, sessionId),
          eq(voteCounts.questionId, questionId),
          eq(voteCounts.optionId, optionId)
        )
      )
      .limit(1);
    
    return result || null;
  },

  /**
   * Reset counts for a session (admin feature)
   */
  async resetForSession(sessionId) {
    await db
      .update(voteCounts)
      .set({ count: 0, updatedAt: new Date() })
      .where(eq(voteCounts.sessionId, sessionId));
  },
};