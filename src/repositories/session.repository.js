import { eq, and, desc } from 'drizzle-orm';
import { db } from '../config/database.js';
import { sessions, questions, options } from '../db/schema/index.js';

export const sessionRepository = {
  /**
   * Create a new session
   */
  async create(data) {
    const [session] = await db
      .insert(sessions)
      .values(data)
      .returning();
    
    return session;
  },

  /**
   * Find session by ID
   */
  async findById(id) {
    const [session] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, id))
      .limit(1);
    
    return session || null;
  },

  /**
   * Find session by join code
   */
  async findByJoinCode(joinCode) {
    const [session] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.joinCode, joinCode))
      .limit(1);
    
    return session || null;
  },

  /**
   * Find session by ID and organizer ID (for authorization)
   */
  async findByIdAndOrganizer(id, organizerId) {
    const [session] = await db
      .select()
      .from(sessions)
      .where(
        and(
          eq(sessions.id, id),
          eq(sessions.organizerId, organizerId)
        )
      )
      .limit(1);
    
    return session || null;
  },

  /**
   * Get all sessions for an organizer
   */
  async findByOrganizer(organizerId, limit = 50, offset = 0) {
    const results = await db
      .select()
      .from(sessions)
      .where(eq(sessions.organizerId, organizerId))
      .orderBy(desc(sessions.createdAt))
      .limit(limit)
      .offset(offset);
    
    return results;
  },

  /**
   * Update session
   */
  async update(id, data) {
    const [session] = await db
      .update(sessions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(sessions.id, id))
      .returning();
    
    return session;
  },

  /**
   * Delete session
   */
  async delete(id) {
    await db
      .delete(sessions)
      .where(eq(sessions.id, id));
    
    return true;
  },

  /**
   * Get session with questions and options
   */
  async findWithQuestions(id) {
    const session = await db.query.sessions.findFirst({
      where: eq(sessions.id, id),
      with: {
        questions: {
          orderBy: (questions, { asc }) => [asc(questions.questionOrder)],
          with: {
            options: {
              orderBy: (options, { asc }) => [asc(options.optionOrder)],
            },
          },
        },
      },
    });
    
    return session || null;
  },

  /**
   * Get session with questions by join code
   */
  async findByJoinCodeWithQuestions(joinCode) {
    const session = await db.query.sessions.findFirst({
      where: eq(sessions.joinCode, joinCode),
      with: {
        questions: {
          orderBy: (questions, { asc }) => [asc(questions.questionOrder)],
          with: {
            options: {
              orderBy: (options, { asc }) => [asc(options.optionOrder)],
            },
          },
        },
      },
    });
    
    return session || null;
  },

  /**
   * Check if join code exists
   */
  async joinCodeExists(joinCode) {
    const session = await this.findByJoinCode(joinCode);
    return !!session;
  },

  /**
   * Update session status
   */
  async updateStatus(id, status) {
    return await this.update(id, { status });
  },
};