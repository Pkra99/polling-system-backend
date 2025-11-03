import { eq, and } from 'drizzle-orm';
import { db } from '../config/database.js';
import { votes } from '../db/schema/index.js';

export const voteRepository = {
  /**
   * Create a new vote
   */
  async create(data) {
    try {
      const [vote] = await db
        .insert(votes)
        .values(data)
        .returning();
      
      return vote;
    } catch (error) {
      // Handle duplicate vote (unique constraint violation)
      if (error.code === '23505') {
        return null; // Vote already exists
      }
      throw error;
    }
  },

  /**
   * Create multiple votes (batch)
   */
  async createMany(dataArray) {
    try {
      const results = await db
        .insert(votes)
        .values(dataArray)
        .returning();
      
      return results;
    } catch (error) {
      // If any vote is duplicate, return empty array
      if (error.code === '23505') {
        return [];
      }
      throw error;
    }
  },

  /**
   * Check if participant has already voted
   */
  async hasVoted(sessionId, questionId, participantFingerprint) {
    const [vote] = await db
      .select()
      .from(votes)
      .where(
        and(
          eq(votes.sessionId, sessionId),
          eq(votes.questionId, questionId),
          eq(votes.participantFingerprint, participantFingerprint)
        )
      )
      .limit(1);
    
    return !!vote;
  },

  /**
   * Get all votes for a session
   */
  async findBySession(sessionId) {
    return await db
      .select()
      .from(votes)
      .where(eq(votes.sessionId, sessionId));
  },

  /**
   * Get all votes for a question
   */
  async findByQuestion(questionId) {
    return await db
      .select()
      .from(votes)
      .where(eq(votes.questionId, questionId));
  },

  /**
   * Count total votes for a session
   */
  async countBySession(sessionId) {
    const result = await db
      .select()
      .from(votes)
      .where(eq(votes.sessionId, sessionId));
    
    return result.length;
  },

  /**
   * Count unique participants in a session
   */
  async countUniqueParticipants(sessionId) {
    const result = await db
      .selectDistinct({ fingerprint: votes.participantFingerprint })
      .from(votes)
      .where(eq(votes.sessionId, sessionId));
    
    return result.length;
  },
};