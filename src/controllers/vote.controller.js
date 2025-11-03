import { voteService } from '../services/vote.service.js';
import { asyncHandler } from '../middleware/error.middleware.js';

export const voteController = {
  /**
   * Submit votes (public endpoint)
   * POST /api/public/sessions/:joinCode/votes
   */
  submitVotes: asyncHandler(async (req, res) => {
    const { joinCode } = req.params;
    const { votes } = req.body;

    const result = await voteService.submitVotes(joinCode, votes, req);

    // Return 202 Accepted (processing asynchronously)
    res.status(202).json({
      status: 'accepted',
      message: 'Votes queued for processing',
      data: result,
    });
  }),

  /**
   * Get voting status for participant
   * GET /api/public/sessions/:joinCode/voting-status
   */
  getVotingStatus: asyncHandler(async (req, res) => {
    const { joinCode } = req.params;

    const status = await voteService.getVotingStatus(joinCode, req);

    res.status(200).json({
      status: 'success',
      data: status,
    });
  }),
};