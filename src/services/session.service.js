import { sessionRepository } from '../repositories/session.repository.js';
import { generateJoinCode } from '../utils/joinCode.js';
import { redis } from '../config/redis.js';
import { env } from '../config/env.js';
import { 
  NotFoundError, 
  ConflictError, 
  AuthorizationError,
  ValidationError 
} from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export const sessionService = {
  /**
   * Create a new session
   */
  async createSession(organizerId, { title, description }) {
    // Generate unique join code
    let joinCode;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      joinCode = generateJoinCode();
      attempts++;
      
      if (attempts > maxAttempts) {
        throw new Error('Failed to generate unique join code');
      }
    } while (await sessionRepository.joinCodeExists(joinCode));

    // Create session
    const session = await sessionRepository.create({
      organizerId,
      title,
      description: description || null,
      joinCode,
      status: 'draft',
    });

    logger.info('Session created', { 
      sessionId: session.id, 
      joinCode: session.joinCode,
      organizerId 
    });

    return session;
  },

  /**
   * Get session by ID (with authorization check)
   */
  async getSessionById(sessionId, organizerId) {
    const session = await sessionRepository.findByIdAndOrganizer(sessionId, organizerId);
    
    if (!session) {
      throw new NotFoundError('Session not found or access denied');
    }

    return session;
  },

  /**
   * Get session with questions
   */
  async getSessionWithQuestions(sessionId, organizerId) {
    const session = await sessionRepository.findWithQuestions(sessionId);
    
    if (!session) {
      throw new NotFoundError('Session not found');
    }

    // Check authorization
    if (session.organizerId !== organizerId) {
      throw new AuthorizationError('Access denied');
    }

    return session;
  },

  /**
   * Get all sessions for organizer
   */
  async getOrganizerSessions(organizerId, page = 1, limit = 50) {
    const offset = (page - 1) * limit;
    const sessions = await sessionRepository.findByOrganizer(organizerId, limit, offset);
    
    return {
      sessions,
      pagination: {
        page,
        limit,
        total: sessions.length,
      },
    };
  },

  /**
   * Update session
   */
  async updateSession(sessionId, organizerId, updates) {
    // Verify ownership
    const session = await this.getSessionById(sessionId, organizerId);

    // Validate status transition
    if (updates.status) {
      this.validateStatusTransition(session.status, updates.status);
    }

    // Update session
    const updatedSession = await sessionRepository.update(sessionId, updates);

    // Invalidate cache
    await redis.del(`session:${session.joinCode}`);

    logger.info('Session updated', { sessionId, updates });

    return updatedSession;
  },

  /**
   * Start session (change status to active)
   */
  async startSession(sessionId, organizerId) {
    const session = await this.getSessionById(sessionId, organizerId);

    if (session.status === 'active') {
      throw new ConflictError('Session is already active');
    }

    if (session.status === 'closed') {
      throw new ConflictError('Cannot start a closed session');
    }

    const updatedSession = await sessionRepository.updateStatus(sessionId, 'active');

    // Invalidate cache
    await redis.del(`session:${session.joinCode}`);

    logger.info('Session started', { sessionId, joinCode: session.joinCode });

    return updatedSession;
  },

  /**
   * Stop session (change status to stopped)
   */
  async stopSession(sessionId, organizerId) {
    const session = await this.getSessionById(sessionId, organizerId);

    if (session.status !== 'active') {
      throw new ConflictError('Only active sessions can be stopped');
    }

    const updatedSession = await sessionRepository.updateStatus(sessionId, 'stopped');

    // Invalidate cache
    await redis.del(`session:${session.joinCode}`);

    logger.info('Session stopped', { sessionId, joinCode: session.joinCode });

    return updatedSession;
  },

  /**
   * Close session (change status to closed) - Bonus feature
   */
  async closeSession(sessionId, organizerId) {
    const session = await this.getSessionById(sessionId, organizerId);

    if (session.status === 'closed') {
      throw new ConflictError('Session is already closed');
    }

    const updatedSession = await sessionRepository.updateStatus(sessionId, 'closed');

    // Invalidate cache
    await redis.del(`session:${session.joinCode}`);
    await redis.del(`results:${sessionId}`);

    logger.info('Session closed', { sessionId, joinCode: session.joinCode });

    return updatedSession;
  },

  /**
   * Delete session
   */
  async deleteSession(sessionId, organizerId) {
    const session = await this.getSessionById(sessionId, organizerId);

    await sessionRepository.delete(sessionId);

    // Clean up cache
    await redis.del(`session:${session.joinCode}`);
    await redis.del(`results:${sessionId}`);

    logger.info('Session deleted', { sessionId, joinCode: session.joinCode });

    return true;
  },

  /**
   * Get session by join code (public)
   */
  async getSessionByJoinCode(joinCode) {
    // Try cache first
    const cached = await redis.getJSON(`session:${joinCode}`);
    if (cached) {
      logger.debug('Session cache hit', { joinCode });
      return cached;
    }

    // Get from database
    const session = await sessionRepository.findByJoinCode(joinCode);
    
    if (!session) {
      throw new NotFoundError('Session not found with this join code');
    }

    // Cache for future requests
    await redis.setJSON(`session:${joinCode}`, session, env.SESSION_CACHE_TTL);

    return session;
  },

  /**
   * Get session with questions by join code (public)
   */
  async getSessionWithQuestionsByJoinCode(joinCode) {
    const session = await sessionRepository.findByJoinCodeWithQuestions(joinCode);
    
    if (!session) {
      throw new NotFoundError('Session not found with this join code');
    }

    return session;
  },

  /**
   * Validate status transition
   */
  validateStatusTransition(currentStatus, newStatus) {
    const validTransitions = {
      draft: ['active'],
      active: ['stopped', 'closed'],
      stopped: ['active', 'closed'],
      closed: [], // Cannot transition from closed
    };

    const allowed = validTransitions[currentStatus] || [];
    
    if (!allowed.includes(newStatus)) {
      throw new ValidationError(
        `Cannot transition from ${currentStatus} to ${newStatus}`
      );
    }
  },
};