import express from 'express';
import { resultController } from '../controllers/result.controller.js';
import { validate } from '../middleware/validation.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { getResultsSchema } from '../validators/result.validator.js';

const router = express.Router();

/**
 * @route   GET /api/results/sessions/:joinCode
 * @desc    Get current results for a session
 * @access  Public
 */
router.get(
  '/sessions/:joinCode',
  validate(getResultsSchema),
  resultController.getResults
);

/**
 * @route   GET /api/results/sessions/:joinCode/analytics
 * @desc    Get analytics for a session (bonus)
 * @access  Public
 */
router.get(
  '/sessions/:joinCode/analytics',
  validate(getResultsSchema),
  resultController.getAnalytics
);

/**
 * @route   GET /api/results/sessions/:joinCode/stream
 * @desc    Stream real-time results via SSE
 * @access  Public
 */
router.get(
  '/sessions/:joinCode/stream',
  validate(getResultsSchema),
  resultController.streamResults
);

/**
 * @route   GET /api/results/stats
 * @desc    Get SSE connection statistics
 * @access  Protected
 */
router.get(
  '/stats',
  authenticate,
  resultController.getConnectionStats
);
