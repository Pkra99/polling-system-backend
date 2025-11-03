import express from 'express';
import { sessionController } from '../controllers/session.controller.js';
import { validate } from '../middleware/validation.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  createSessionSchema,
  updateSessionSchema,
  getSessionSchema,
  paginationSchema,
} from '../validators/session.validator.js';

const router = express.Router();

// All session routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/sessions
 * @desc    Create a new session
 * @access  Protected
 */
router.post(
  '/',
  validate(createSessionSchema),
  sessionController.createSession
);

/**
 * @route   GET /api/sessions
 * @desc    Get all sessions for current organizer
 * @access  Protected
 */
router.get(
  '/',
  validate(paginationSchema),
  sessionController.getSessions
);

/**
 * @route   GET /api/sessions/:id
 * @desc    Get session by ID with questions
 * @access  Protected
 */
router.get(
  '/:id',
  validate(getSessionSchema),
  sessionController.getSession
);

/**
 * @route   PATCH /api/sessions/:id
 * @desc    Update session
 * @access  Protected
 */
router.patch(
  '/:id',
  validate(updateSessionSchema),
  sessionController.updateSession
);

/**
 * @route   PATCH /api/sessions/:id/start
 * @desc    Start session (make it active)
 * @access  Protected
 */
router.patch(
  '/:id/start',
  validate(getSessionSchema),
  sessionController.startSession
);

/**
 * @route   PATCH /api/sessions/:id/stop
 * @desc    Stop session
 * @access  Protected
 */
router.patch(
  '/:id/stop',
  validate(getSessionSchema),
  sessionController.stopSession
);

/**
 * @route   PATCH /api/sessions/:id/close
 * @desc    Close session (bonus feature)
 * @access  Protected
 */
router.patch(
  '/:id/close',
  validate(getSessionSchema),
  sessionController.closeSession
);

/**
 * @route   DELETE /api/sessions/:id
 * @desc    Delete session
 * @access  Protected
 */
router.delete(
  '/:id',
  validate(getSessionSchema),
  sessionController.deleteSession
);

export default router;