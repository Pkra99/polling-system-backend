import { eq, and, desc, asc } from 'drizzle-orm';
import { db } from '../config/database.js';
import { questions, options } from '../db/schema/index.js';

export const questionRepository = {
  /**
   * Create a new question
   */
  async create(data) {
    const [question] = await db
      .insert(questions)
      .values(data)
      .returning();
    
    return question;
  },

  /**
   * Find question by ID
   */
  async findById(id) {
    const [question] = await db
      .select()
      .from(questions)
      .where(eq(questions.id, id))
      .limit(1);
    
    return question || null;
  },

  /**
   * Find question by ID with options
   */
  async findByIdWithOptions(id) {
    const question = await db.query.questions.findFirst({
      where: eq(questions.id, id),
      with: {
        options: {
          orderBy: (options, { asc }) => [asc(options.optionOrder)],
        },
      },
    });
    
    return question || null;
  },

  /**
   * Find all questions for a session
   */
  async findBySession(sessionId) {
    const results = await db
      .select()
      .from(questions)
      .where(eq(questions.sessionId, sessionId))
      .orderBy(asc(questions.questionOrder));
    
    return results;
  },

  /**
   * Find all questions for a session with options
   */
  async findBySessionWithOptions(sessionId) {
    const results = await db.query.questions.findMany({
      where: eq(questions.sessionId, sessionId),
      orderBy: (questions, { asc }) => [asc(questions.questionOrder)],
      with: {
        options: {
          orderBy: (options, { asc }) => [asc(options.optionOrder)],
        },
      },
    });
    
    return results;
  },

  /**
   * Update question
   */
  async update(id, data) {
    const [question] = await db
      .update(questions)
      .set(data)
      .where(eq(questions.id, id))
      .returning();
    
    return question;
  },

  /**
   * Delete question
   */
  async delete(id) {
    await db
      .delete(questions)
      .where(eq(questions.id, id));
    
    return true;
  },

  /**
   * Get max question order for a session
   */
  async getMaxOrder(sessionId) {
    const result = await db
      .select()
      .from(questions)
      .where(eq(questions.sessionId, sessionId))
      .orderBy(desc(questions.questionOrder))
      .limit(1);
    
    return result[0]?.questionOrder ?? -1;
  },

  /**
   * Count questions in a session
   */
  async countBySession(sessionId) {
    const result = await db
      .select()
      .from(questions)
      .where(eq(questions.sessionId, sessionId));
    
    return result.length;
  },
};