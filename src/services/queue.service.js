import { redis } from '../config/redis.js';
import { logger } from '../utils/logger.js';

export const queueService = {
  /**
   * Add vote to processing queue
   */
  async enqueueVote(sessionId, voteData) {
    const queueKey = `vote_queue:${sessionId}`;
    const serialized = JSON.stringify(voteData);
    
    await redis.lpush(queueKey, serialized);
    
    logger.debug('Vote enqueued', { sessionId, queueKey });
  },

  /**
   * Add multiple votes to queue (batch)
   */
  async enqueueVotes(sessionId, votesArray) {
    if (votesArray.length === 0) return;
    
    const queueKey = `vote_queue:${sessionId}`;
    const serialized = votesArray.map(v => JSON.stringify(v));
    
    // Use pipeline for efficiency
    for (const item of serialized) {
      await redis.lpush(queueKey, item);
    }
    
    logger.debug('Votes enqueued', { sessionId, count: votesArray.length });
  },

  /**
   * Get votes from queue (batch)
   */
  async dequeueVotes(sessionId, batchSize = 10) {
    const queueKey = `vote_queue:${sessionId}`;
    const votes = [];
    
    for (let i = 0; i < batchSize; i++) {
      const item = await redis.rpop(queueKey);
      if (!item) break;
      
      try {
        votes.push(JSON.parse(item));
      } catch (error) {
        logger.error('Failed to parse vote from queue', { error: error.message });
      }
    }
    
    return votes;
  },

  /**
   * Get queue length
   */
  async getQueueLength(sessionId) {
    const queueKey = `vote_queue:${sessionId}`;
    return await redis.llen(queueKey);
  },

  /**
   * Clear queue for a session
   */
  async clearQueue(sessionId) {
    const queueKey = `vote_queue:${sessionId}`;
    await redis.del(queueKey);
    
    logger.info('Queue cleared', { sessionId });
  },

  /**
   * Get all active queue keys
   */
  async getActiveQueues() {
    // This would require KEYS command or tracking active queues
    // For now, we'll rely on worker to process known sessions
    return [];
  },
};