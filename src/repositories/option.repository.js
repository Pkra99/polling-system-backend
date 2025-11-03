import { eq, and, desc, asc, inArray } from 'drizzle-orm';
import { db } from '../config/database.js';
import { options } from '../db/schema/index.js';

export const optionRepository = {
  /**
   * Create a new option
   */
  async create(data) {
    const [option] = await db
      .insert(options)
      .values(data)
      .returning();
    
    return option;
  },

  /**
   * Create multiple options
   */
  async createMany(dataArray) {
    const results = await db
      .insert(options)
      .values(dataArray)
      .returning();
    
    return results;
  },

  /**
   * Find option by ID
   */
  async findById(id) {
    const [option] = await db
      .select()
      .from(options)
      .where(eq(options.id, id))
      .limit(1);
    
    return option || null;
  },

  /**
   * Find all options for a question
   */
  async findByQuestion(questionId) {
    const results = await db
      .select()
      .from(options)
      .where(eq(options.questionId, questionId))
      .orderBy(asc(options.optionOrder));
    
    return results;
  },

  /**
   * Update option
   */
  async update(id, data) {
    const [option] = await db
      .update(options)
      .set(data)
      .where(eq(options.id, id))
      .returning();
    
    return option;
  },

  /**
   * Delete option
   */
  async delete(id) {
    await db
      .delete(options)
      .where(eq(options.id, id));
    
    return true;
  },

  /**
   * Delete all options for a question
   */
  async deleteByQuestion(questionId) {
    await db
      .delete(options)
      .where(eq(options.questionId, questionId));
    
    return true;
  },

  /**
   * Get max option order for a question
   */
  async getMaxOrder(questionId) {
    const result = await db
      .select()
      .from(options)
      .where(eq(options.questionId, questionId))
      .orderBy(desc(options.optionOrder))
      .limit(1);
    
    return result[0]?.optionOrder ?? -1;
  },

  /**
   * Count options for a question
   */
  async countByQuestion(questionId) {
    const result = await db
      .select()
      .from(options)
      .where(eq(options.questionId, questionId));
    
    return result.length;
  },

  /**
   * Check if option exists
   */
  async exists(id) {
    const option = await this.findById(id);
    return !!option;
  },
};