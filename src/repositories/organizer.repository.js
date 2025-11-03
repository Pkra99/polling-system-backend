import { eq } from 'drizzle-orm';
import { db } from '../config/database.js';
import { organizers } from '../db/schema/index.js';

export const organizerRepository = {
  /**
   * Create a new organizer
   */
  async create(data) {
    const [organizer] = await db
      .insert(organizers)
      .values(data)
      .returning();
    
    return organizer;
  },

  /**
   * Find organizer by ID
   */
  async findById(id) {
    const [organizer] = await db
      .select()
      .from(organizers)
      .where(eq(organizers.id, id))
      .limit(1);
    
    return organizer || null;
  },

  /**
   * Find organizer by email
   */
  async findByEmail(email) {
    const [organizer] = await db
      .select()
      .from(organizers)
      .where(eq(organizers.email, email))
      .limit(1);
    
    return organizer || null;
  },

  /**
   * Update organizer
   */
  async update(id, data) {
    const [organizer] = await db
      .update(organizers)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(organizers.id, id))
      .returning();
    
    return organizer;
  },

  /**
   * Delete organizer
   */
  async delete(id) {
    await db
      .delete(organizers)
      .where(eq(organizers.id, id));
    
    return true;
  },

  /**
   * Check if email exists
   */
  async emailExists(email) {
    const organizer = await this.findByEmail(email);
    return !!organizer;
  },
};