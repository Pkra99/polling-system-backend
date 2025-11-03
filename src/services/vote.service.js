import { voteRepository } from '../repositories/vote.repository.js';
import { voteCountRepository } from '../repositories/voteCount.repository.js';
import { sessionRepository } from '../repositories/session.repository.js';
import { questionRepository } from '../repositories/question.repository.js';
import { optionRepository } from '../repositories/option.repository.js';
import { queueService } from './queue.service.js';
import { generateFingerprint, getClientIp, getUserAgent } from '../utils/fingerprint.js';
import { 
  NotFoundError, 
  ValidationError,
  ConflictError 
} from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export const voteService = {
  /**
   * Submit votes (returns immediately - 202 Accepted)
   */
  async submitVotes(joinCode, votesData, req) {
    // Get session by join code
    const session = await sessionRepository.findByJoinCode(joinCode);
    if (!session) {
      throw new NotFoundError('Session not found');
    }

    // Check if session is active
    if (session.status !== 'active') {
      throw new ConflictError('Session is not active for voting');
    }

    // Validate votes data
    if (!votesData || votesData.length === 0) {
      throw new ValidationError('No votes provided');
    }

    // Generate participant fingerprint
    const ip = getClientIp(req);
    const userAgent = getUserAgent(req);
    const fingerprint = generateFingerprint(ip, userAgent, session.id);

    // Validate each vote and prepare for queue
    const validatedVotes = [];
    
    for (const vote of votesData) {
      const { questionId, optionId } = vote;

      // Validate question exists and belongs to session
      const question = await questionRepository.findById(questionId);
      if (!question || question.sessionId !== session.id) {
        throw new ValidationError(`Invalid question ID: ${questionId}`);
      }

      // Validate option exists and belongs to question
      const option = await optionRepository.findById(optionId);
      if (!option || option.questionId !== questionId) {
        throw new ValidationError(`Invalid option ID: ${optionId}`);
      }

      // Check if already voted (quick check)
      const hasVoted = await voteRepository.hasVoted(
        session.id,
        questionId,
        fingerprint
      );

      if (hasVoted) {
        logger.warn('Duplicate vote attempt', { 
          sessionId: session.id, 
          questionId, 
          fingerprint: fingerprint.substring(0, 8) 
        });
        continue; // Skip this vote
      }

      validatedVotes.push({
        sessionId: session.id,
        questionId,
        optionId,
        participantFingerprint: fingerprint,
      });
    }

    if (validatedVotes.length === 0) {
      throw new ConflictError('All votes already submitted or invalid');
    }

    // Add votes to queue for async processing
    await queueService.enqueueVotes(session.id, validatedVotes);

    logger.info('Votes queued for processing', {
      sessionId: session.id,
      count: validatedVotes.length,
      fingerprint: fingerprint.substring(0, 8),
    });

    return {
      queued: validatedVotes.length,
      sessionId: session.id,
    };
  },

  /**
   * Process votes from queue (called by worker)
   */
  async processVotes(sessionId, votes) {
    const results = {
      processed: 0,
      duplicates: 0,
      errors: 0,
    };

    for (const voteData of votes) {
      try {
        // Attempt to create vote (will fail on duplicate due to unique constraint)
        const vote = await voteRepository.create(voteData);
        
        if (vote) {
          // Increment vote count
          await voteCountRepository.increment(
            voteData.sessionId,
            voteData.questionId,
            voteData.optionId
          );
          
          results.processed++;
        } else {
          // Vote was duplicate
          results.duplicates++;
        }
      } catch (error) {
        logger.error('Error processing vote', {
          error: error.message,
          voteData,
        });
        results.errors++;
      }
    }

    logger.info('Votes processed', {
      sessionId,
      ...results,
    });

    return results;
  },

  /**
   * Check if participant has voted on a question
   */
  async hasVotedOnQuestion(sessionId, questionId, req) {
    const ip = getClientIp(req);
    const userAgent = getUserAgent(req);
    const fingerprint = generateFingerprint(ip, userAgent, sessionId);

    return await voteRepository.hasVoted(sessionId, questionId, fingerprint);
  },

  /**
   * Get participant's voting status for a session
   */
  async getVotingStatus(joinCode, req) {
    const session = await sessionRepository.findByJoinCodeWithQuestions(joinCode);
    if (!session) {
      throw new NotFoundError('Session not found');
    }

    const ip = getClientIp(req);
    const userAgent = getUserAgent(req);
    const fingerprint = generateFingerprint(ip, userAgent, session.id);

    const votingStatus = await Promise.all(
      session.questions.map(async (question) => ({
        questionId: question.id,
        hasVoted: await voteRepository.hasVoted(session.id, question.id, fingerprint),
      }))
    );

    return {
      sessionId: session.id,
      questions: votingStatus,
    };
  },
};