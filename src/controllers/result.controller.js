import { resultService } from '../services/result.service.js';
import { sessionRepository } from '../repositories/session.repository.js';
import { sseManager } from '../services/sse.service.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { NotFoundError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export const resultController = {
  /**
   * Get current results for a session
   * GET /api/results/sessions/:joinCode
   */
  getResults: asyncHandler(async (req, res) => {
    const { joinCode } = req.params;

    const results = await resultService.getSessionResults(joinCode);

    res.status(200).json({
      status: 'success',
      data: results,
    });
  }),

  /**
   * Get analytics for a session (bonus feature)
   * GET /api/results/sessions/:joinCode/analytics
   */
  getAnalytics: asyncHandler(async (req, res) => {
    const { joinCode } = req.params;

    const analytics = await resultService.getSessionAnalytics(joinCode);

    res.status(200).json({
      status: 'success',
      data: analytics,
    });
  }),

  /**
   * Stream real-time results via SSE
   * GET /api/results/sessions/:joinCode/stream
   */
  streamResults: asyncHandler(async (req, res) => {
    const { joinCode } = req.params;

    // Verify session exists
    const session = await sessionRepository.findByJoinCode(joinCode);
    if (!session) {
      throw new NotFoundError('Session not found');
    }

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

    // Initialize SSE manager if not already done
    await sseManager.initialize();

    // Add this connection
    sseManager.addConnection(session.id, res);

    // Send initial results
    try {
      const initialResults = await resultService.getSessionResults(joinCode);
      sseManager.sendToClient(res, {
        type: 'initial_results',
        data: initialResults,
      });
    } catch (error) {
      logger.error('Failed to send initial results', { error: error.message });
    }

    // Handle client disconnect
    req.on('close', () => {
      sseManager.removeConnection(session.id, res);
      res.end();
    });
  }),

  /**
   * Get SSE connection stats (protected - for organizers)
   * GET /api/results/stats
   */
  getConnectionStats: asyncHandler(async (req, res) => {
    const stats = sseManager.getStats();

    res.status(200).json({
      status: 'success',
      data: stats,
    });
  }),
};