import { questionService } from '../services/question.service.js';
import { asyncHandler } from '../middleware/error.middleware.js';

export const questionController = {
  /**
   * Add question to session
   * POST /api/sessions/:sessionId/questions
   */
  addQuestion: asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const { questionText, options } = req.body;
    const organizerId = req.organizer.id;

    const question = await questionService.addQuestion(
      sessionId,
      organizerId,
      { questionText, options }
    );

    res.status(201).json({
      status: 'success',
      message: 'Question added successfully',
      data: {
        question,
      },
    });
  }),

  /**
   * Get all questions for a session
   * GET /api/sessions/:sessionId/questions
   */
  getSessionQuestions: asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const organizerId = req.organizer.id;

    const questions = await questionService.getSessionQuestions(sessionId, organizerId);

    res.status(200).json({
      status: 'success',
      data: {
        questions,
        count: questions.length,
      },
    });
  }),

  /**
   * Get question by ID
   * GET /api/questions/:questionId
   */
  getQuestion: asyncHandler(async (req, res) => {
    const { questionId } = req.params;
    const organizerId = req.organizer.id;

    const question = await questionService.getQuestionById(questionId, organizerId);

    res.status(200).json({
      status: 'success',
      data: {
        question,
      },
    });
  }),

  /**
   * Update question
   * PUT /api/questions/:questionId
   */
  updateQuestion: asyncHandler(async (req, res) => {
    const { questionId } = req.params;
    const { questionText, options } = req.body;
    const organizerId = req.organizer.id;

    const question = await questionService.updateQuestion(
      questionId,
      organizerId,
      { questionText, options }
    );

    res.status(200).json({
      status: 'success',
      message: 'Question updated successfully',
      data: {
        question,
      },
    });
  }),

  /**
   * Delete question
   * DELETE /api/questions/:questionId
   */
  deleteQuestion: asyncHandler(async (req, res) => {
    const { questionId } = req.params;
    const organizerId = req.organizer.id;

    await questionService.deleteQuestion(questionId, organizerId);

    res.status(200).json({
      status: 'success',
      message: 'Question deleted successfully',
    });
  }),

  /**
   * Reorder questions in a session
   * PATCH /api/sessions/:sessionId/questions/reorder
   */
  reorderQuestions: asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const { questionOrders } = req.body;
    const organizerId = req.organizer.id;

    const questions = await questionService.reorderQuestions(
      sessionId,
      organizerId,
      questionOrders
    );

    res.status(200).json({
      status: 'success',
      message: 'Questions reordered successfully',
      data: {
        questions,
      },
    });
  }),
};
