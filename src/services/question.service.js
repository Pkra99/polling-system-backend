import { questionRepository } from '../repositories/question.repository.js';
import { optionRepository } from '../repositories/option.repository.js';
import { sessionRepository } from '../repositories/session.repository.js';
import { 
  NotFoundError, 
  AuthorizationError,
  ValidationError,
  ConflictError 
} from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export const questionService = {
  /**
   * Add question to session
   */
  async addQuestion(sessionId, organizerId, { questionText, options: optionsData }) {
    // Verify session ownership
    const session = await sessionRepository.findByIdAndOrganizer(sessionId, organizerId);
    if (!session) {
      throw new NotFoundError('Session not found or access denied');
    }

    // Cannot add questions to active or closed sessions
    if (session.status === 'active') {
      throw new ConflictError('Cannot add questions to an active session');
    }
    if (session.status === 'closed') {
      throw new ConflictError('Cannot add questions to a closed session');
    }

    // Validate options
    if (!optionsData || optionsData.length < 2) {
      throw new ValidationError('Question must have at least 2 options');
    }
    if (optionsData.length > 10) {
      throw new ValidationError('Question cannot have more than 10 options');
    }

    // Get next question order
    const maxOrder = await questionRepository.getMaxOrder(sessionId);
    const questionOrder = maxOrder + 1;

    // Create question
    const question = await questionRepository.create({
      sessionId,
      questionText,
      questionOrder,
    });

    // Create options
    const optionsToCreate = optionsData.map((optText, index) => ({
      questionId: question.id,
      optionText: optText.trim(),
      optionOrder: index,
    }));

    const createdOptions = await optionRepository.createMany(optionsToCreate);

    logger.info('Question added to session', {
      sessionId,
      questionId: question.id,
      optionsCount: createdOptions.length,
    });

    return {
      ...question,
      options: createdOptions,
    };
  },

  /**
   * Get question by ID
   */
  async getQuestionById(questionId, organizerId) {
    const question = await questionRepository.findByIdWithOptions(questionId);
    
    if (!question) {
      throw new NotFoundError('Question not found');
    }

    // Verify session ownership
    const session = await sessionRepository.findById(question.sessionId);
    if (!session || session.organizerId !== organizerId) {
      throw new AuthorizationError('Access denied');
    }

    return question;
  },

  /**
   * Get all questions for a session
   */
  async getSessionQuestions(sessionId, organizerId) {
    // Verify session ownership
    const session = await sessionRepository.findByIdAndOrganizer(sessionId, organizerId);
    if (!session) {
      throw new NotFoundError('Session not found or access denied');
    }

    const questions = await questionRepository.findBySessionWithOptions(sessionId);
    
    return questions;
  },

  /**
   * Update question
   */
  async updateQuestion(questionId, organizerId, { questionText, options: optionsData }) {
    const question = await questionRepository.findById(questionId);
    
    if (!question) {
      throw new NotFoundError('Question not found');
    }

    // Verify session ownership
    const session = await sessionRepository.findById(question.sessionId);
    if (!session || session.organizerId !== organizerId) {
      throw new AuthorizationError('Access denied');
    }

    // Cannot update questions in active or closed sessions
    if (session.status === 'active') {
      throw new ConflictError('Cannot update questions in an active session');
    }
    if (session.status === 'closed') {
      throw new ConflictError('Cannot update questions in a closed session');
    }

    // Update question text if provided
    if (questionText) {
      await questionRepository.update(questionId, { questionText });
    }

    // Update options if provided
    if (optionsData && optionsData.length > 0) {
      // Validate options count
      if (optionsData.length < 2) {
        throw new ValidationError('Question must have at least 2 options');
      }
      if (optionsData.length > 10) {
        throw new ValidationError('Question cannot have more than 10 options');
      }

      // Delete existing options
      await optionRepository.deleteByQuestion(questionId);

      // Create new options
      const optionsToCreate = optionsData.map((optText, index) => ({
        questionId,
        optionText: optText.trim(),
        optionOrder: index,
      }));

      await optionRepository.createMany(optionsToCreate);
    }

    logger.info('Question updated', { questionId, sessionId: question.sessionId });

    return await questionRepository.findByIdWithOptions(questionId);
  },

  /**
   * Delete question
   */
  async deleteQuestion(questionId, organizerId) {
    const question = await questionRepository.findById(questionId);
    
    if (!question) {
      throw new NotFoundError('Question not found');
    }

    // Verify session ownership
    const session = await sessionRepository.findById(question.sessionId);
    if (!session || session.organizerId !== organizerId) {
      throw new AuthorizationError('Access denied');
    }

    // Cannot delete questions from active or closed sessions
    if (session.status === 'active') {
      throw new ConflictError('Cannot delete questions from an active session');
    }
    if (session.status === 'closed') {
      throw new ConflictError('Cannot delete questions from a closed session');
    }

    // Delete question (cascade will delete options)
    await questionRepository.delete(questionId);

    logger.info('Question deleted', { questionId, sessionId: question.sessionId });

    return true;
  },

  /**
   * Reorder questions in a session
   */
  async reorderQuestions(sessionId, organizerId, questionOrders) {
    // Verify session ownership
    const session = await sessionRepository.findByIdAndOrganizer(sessionId, organizerId);
    if (!session) {
      throw new NotFoundError('Session not found or access denied');
    }

    // Cannot reorder questions in active or closed sessions
    if (session.status === 'active') {
      throw new ConflictError('Cannot reorder questions in an active session');
    }
    if (session.status === 'closed') {
      throw new ConflictError('Cannot reorder questions in a closed session');
    }

    // Update each question's order
    const updates = questionOrders.map(({ questionId, order }) =>
      questionRepository.update(questionId, { questionOrder: order })
    );

    await Promise.all(updates);

    logger.info('Questions reordered', { sessionId, count: questionOrders.length });

    return await questionRepository.findBySessionWithOptions(sessionId);
  },
};