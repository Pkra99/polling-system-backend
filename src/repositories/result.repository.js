import { eq, sql } from 'drizzle-orm';
import { db } from '../config/database.js';
import { voteCounts, questions, options, votes } from '../db/schema/index.js';

export const resultRepository = {
  /**
   * Get vote counts for a session with question and option details
   */
  async getSessionResults(sessionId) {
    const results = await db
      .select({
        questionId: voteCounts.questionId,
        questionText: questions.questionText,
        questionOrder: questions.questionOrder,
        optionId: voteCounts.optionId,
        optionText: options.optionText,
        optionOrder: options.optionOrder,
        count: voteCounts.count,
      })
      .from(voteCounts)
      .innerJoin(questions, eq(voteCounts.questionId, questions.id))
      .innerJoin(options, eq(voteCounts.optionId, options.id))
      .where(eq(voteCounts.sessionId, sessionId))
      .orderBy(questions.questionOrder, options.optionOrder);

    return results;
  },

  /**
   * Get vote counts for a specific question
   */
  async getQuestionResults(questionId) {
    const results = await db
      .select({
        optionId: voteCounts.optionId,
        optionText: options.optionText,
        optionOrder: options.optionOrder,
        count: voteCounts.count,
      })
      .from(voteCounts)
      .innerJoin(options, eq(voteCounts.optionId, options.id))
      .where(eq(voteCounts.questionId, questionId))
      .orderBy(options.optionOrder);

    return results;
  },

  /**
   * Get total votes for a session
   */
  async getTotalVotes(sessionId) {
    const result = await db
      .select({
        total: sql`CAST(SUM(${voteCounts.count}) AS INTEGER)`,
      })
      .from(voteCounts)
      .where(eq(voteCounts.sessionId, sessionId));

    return result[0]?.total || 0;
  },

  /**
   * Get total votes for a question
   */
  async getQuestionTotalVotes(questionId) {
    const result = await db
      .select({
        total: sql`CAST(SUM(${voteCounts.count}) AS INTEGER)`,
      })
      .from(voteCounts)
      .where(eq(voteCounts.questionId, questionId));

    return result[0]?.total || 0;
  },

  /**
   * Get unique participants count for a session
   */
  async getUniqueParticipants(sessionId) {
    const result = await db
      .selectDistinct({ fingerprint: votes.participantFingerprint })
      .from(votes)
      .where(eq(votes.sessionId, sessionId));

    return result.length;
  },

  /**
   * Get participation summary for a session
   */
  async getParticipationSummary(sessionId) {
    const [totalVotesResult, uniqueParticipantsResult] = await Promise.all([
      this.getTotalVotes(sessionId),
      this.getUniqueParticipants(sessionId),
    ]);

    return {
      totalVotes: totalVotesResult,
      uniqueParticipants: uniqueParticipantsResult,
    };
  },
};