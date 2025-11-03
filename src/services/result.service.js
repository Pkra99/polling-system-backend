import { resultRepository } from '../repositories/result.repository.js';
import { sessionRepository } from '../repositories/session.repository.js';
import { redis } from '../config/redis.js';
import { env } from '../config/env.js';
import { NotFoundError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export const resultService = {
  /**
   * Get formatted results for a session
   */
  async getSessionResults(joinCode) {
    // Get session
    const session = await sessionRepository.findByJoinCodeWithQuestions(joinCode);
    if (!session) {
      throw new NotFoundError('Session not found');
    }

    // Try cache first
    const cacheKey = `results:${session.id}`;
    const cached = await redis.getJSON(cacheKey);
    if (cached) {
      logger.debug('Results cache hit', { sessionId: session.id });
      return cached;
    }

    // Get raw results from database
    const rawResults = await resultRepository.getSessionResults(session.id);
    const participationSummary = await resultRepository.getParticipationSummary(session.id);

    // Group results by question
    const questionMap = new Map();

    for (const row of rawResults) {
      if (!questionMap.has(row.questionId)) {
        questionMap.set(row.questionId, {
          questionId: row.questionId,
          questionText: row.questionText,
          questionOrder: row.questionOrder,
          totalVotes: 0,
          options: [],
        });
      }

      const question = questionMap.get(row.questionId);
      question.totalVotes += row.count;
      question.options.push({
        optionId: row.optionId,
        optionText: row.optionText,
        optionOrder: row.optionOrder,
        votes: row.count,
      });
    }

    // Calculate percentages
    const questions = Array.from(questionMap.values()).map(question => {
      const options = question.options.map(option => ({
        ...option,
        percentage: question.totalVotes > 0 
          ? Math.round((option.votes / question.totalVotes) * 100 * 100) / 100 // 2 decimal places
          : 0,
      }));

      return {
        ...question,
        options,
      };
    });

    // Sort by question order
    questions.sort((a, b) => a.questionOrder - b.questionOrder);

    const results = {
      sessionId: session.id,
      sessionTitle: session.title,
      sessionStatus: session.status,
      totalVotes: participationSummary.totalVotes,
      uniqueParticipants: participationSummary.uniqueParticipants,
      questions,
      lastUpdated: new Date().toISOString(),
    };

    // Cache results for 5 seconds (will be invalidated by worker)
    await redis.setJSON(cacheKey, results, 5);

    return results;
  },

  /**
   * Get results for a specific question
   */
  async getQuestionResults(questionId) {
    const rawResults = await resultRepository.getQuestionResults(questionId);
    const totalVotes = await resultRepository.getQuestionTotalVotes(questionId);

    const options = rawResults.map(row => ({
      optionId: row.optionId,
      optionText: row.optionText,
      optionOrder: row.optionOrder,
      votes: row.count,
      percentage: totalVotes > 0 
        ? Math.round((row.count / totalVotes) * 100 * 100) / 100
        : 0,
    }));

    return {
      questionId,
      totalVotes,
      options,
      lastUpdated: new Date().toISOString(),
    };
  },

  /**
   * Invalidate results cache
   */
  async invalidateCache(sessionId) {
    const cacheKey = `results:${sessionId}`;
    await redis.del(cacheKey);
    logger.debug('Results cache invalidated', { sessionId });
  },

  /**
   * Get analytics for a session (bonus feature)
   */
  async getSessionAnalytics(joinCode) {
    const session = await sessionRepository.findByJoinCodeWithQuestions(joinCode);
    if (!session) {
      throw new NotFoundError('Session not found');
    }

    const results = await this.getSessionResults(joinCode);
    
    // Calculate response rate per question
    const questionAnalytics = results.questions.map(question => {
      const responseRate = results.uniqueParticipants > 0
        ? Math.round((question.totalVotes / results.uniqueParticipants) * 100 * 100) / 100
        : 0;

      // Find most popular option
      const mostPopular = question.options.reduce((prev, current) => 
        current.votes > prev.votes ? current : prev
      , question.options[0] || { votes: 0 });

      return {
        questionId: question.questionId,
        questionText: question.questionText,
        totalVotes: question.totalVotes,
        responseRate,
        mostPopularOption: mostPopular.optionText,
        mostPopularVotes: mostPopular.votes,
        mostPopularPercentage: mostPopular.percentage,
      };
    });

    return {
      sessionId: session.id,
      sessionTitle: session.title,
      sessionStatus: session.status,
      summary: {
        totalVotes: results.totalVotes,
        uniqueParticipants: results.uniqueParticipants,
        totalQuestions: session.questions.length,
        averageResponseRate: questionAnalytics.length > 0
          ? Math.round(
              questionAnalytics.reduce((sum, q) => sum + q.responseRate, 0) / 
              questionAnalytics.length * 100
            ) / 100
          : 0,
      },
      questions: questionAnalytics,
    };
  },
};