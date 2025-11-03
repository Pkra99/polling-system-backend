import express from 'express';
import { voteController } from '../controllers/vote.controller.js';
import { sessionService } from '../services/session.service.js';
import { validate } from '../middleware/validation.middleware.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { voteLimiter } from '../middleware/rateLimit.middleware.js';
import { submitVotesSchema, getVotingStatusSchema } from '../validators/vote.validator.js';
import { joinCodeSchema } from '../validators/session.validator.js';

const router = express.Router();

router.get('/sessions/:joinCode', validate(joinCodeSchema), asyncHandler(async (req, res) => {
  const { joinCode } = req.params;
  const session = await sessionService.getSessionByJoinCode(joinCode);
  res.status(200).json({ status: 'success', data: { session } });
}));

router.get('/sessions/:joinCode/questions', validate(joinCodeSchema), asyncHandler(async (req, res) => {
  const { joinCode } = req.params;
  const session = await sessionService.getSessionWithQuestionsByJoinCode(joinCode);
  res.status(200).json({
    status: 'success',
    data: {
      session: {
        id: session.id,
        title: session.title,
        description: session.description,
        status: session.status,
      },
      questions: session.questions,
    },
  });
}));

// Apply strict vote rate limiting
router.post('/sessions/:joinCode/votes', voteLimiter, validate(submitVotesSchema), voteController.submitVotes);

router.get('/sessions/:joinCode/voting-status', validate(getVotingStatusSchema), voteController.getVotingStatus);

export default router;