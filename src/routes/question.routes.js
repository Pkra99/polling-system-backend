import express from 'express';
import { questionController } from '../controllers/question.controller.js';
import { validate } from '../middleware/validation.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  addQuestionSchema,
  updateQuestionSchema,
  getQuestionSchema,
  getSessionQuestionsSchema,
  reorderQuestionsSchema,
} from '../validators/question.validator.js';

const router = express.Router();

// All question routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/sessions/:sessionId/questions
 * @desc    Add question to session
 * @access  Protected
 */
router.post(
  '/sessions/:sessionId/questions',
  validate(addQuestionSchema),
  questionController.addQuestion
);

/**
 * @route   GET /api/sessions/:sessionId/questions
 * @desc    Get all questions for a session
 * @access  Protected
 */
router.get(
  '/sessions/:sessionId/questions',
  validate(getSessionQuestionsSchema),
  questionController.getSessionQuestions
);

/**
 * @route   PATCH /api/sessions/:sessionId/questions/reorder
 * @desc    Reorder questions in a session
 * @access  Protected
 */
router.patch(
  '/sessions/:sessionId/questions/reorder',
  validate(reorderQuestionsSchema),
  questionController.reorderQuestions
);

/**
 * @route   GET /api/questions/:questionId
 * @desc    Get question by ID
 * @access  Protected
 */
router.get(
  '/questions/:questionId',
  validate(getQuestionSchema),
  questionController.getQuestion
);

/**
 * @route   PUT /api/questions/:questionId
 * @desc    Update question
 * @access  Protected
 */
router.put(
  '/questions/:questionId',
  validate(updateQuestionSchema),
  questionController.updateQuestion
);

/**
 * @route   DELETE /api/questions/:questionId
 * @desc    Delete question
 * @access  Protected
 */
router.delete(
  '/questions/:questionId',
  validate(getQuestionSchema),
  questionController.deleteQuestion
);

export default router;