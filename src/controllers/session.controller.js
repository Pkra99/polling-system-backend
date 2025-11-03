import { sessionService } from '../services/session.service.js';
import { asyncHandler } from '../middleware/error.middleware.js';

export const sessionController = {
  /**
   * Create new session
   * POST /api/sessions
   */
  createSession: asyncHandler(async (req, res) => {
    const { title, description } = req.body;
    const organizerId = req.organizer.id;

    const session = await sessionService.createSession(organizerId, { 
      title, 
      description 
    });

    res.status(201).json({
      status: 'success',
      message: 'Session created successfully',
      data: {
        session,
      },
    });
  }),

  /**
   * Get all sessions for current organizer
   * GET /api/sessions
   */
  getSessions: asyncHandler(async (req, res) => {
    const organizerId = req.organizer.id;
    const { page, limit } = req.query;

    const result = await sessionService.getOrganizerSessions(
      organizerId, 
      page, 
      limit
    );

    res.status(200).json({
      status: 'success',
      data: result,
    });
  }),

  /**
   * Get session by ID
   * GET /api/sessions/:id
   */
  getSession: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const organizerId = req.organizer.id;

    const session = await sessionService.getSessionWithQuestions(id, organizerId);

    res.status(200).json({
      status: 'success',
      data: {
        session,
      },
    });
  }),

  /**
   * Update session
   * PATCH /api/sessions/:id
   */
  updateSession: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const organizerId = req.organizer.id;
    const updates = req.body;

    const session = await sessionService.updateSession(id, organizerId, updates);

    res.status(200).json({
      status: 'success',
      message: 'Session updated successfully',
      data: {
        session,
      },
    });
  }),

  /**
   * Start session
   * PATCH /api/sessions/:id/start
   */
  startSession: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const organizerId = req.organizer.id;

    const session = await sessionService.startSession(id, organizerId);

    res.status(200).json({
      status: 'success',
      message: 'Session started successfully',
      data: {
        session,
      },
    });
  }),

  /**
   * Stop session
   * PATCH /api/sessions/:id/stop
   */
  stopSession: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const organizerId = req.organizer.id;

    const session = await sessionService.stopSession(id, organizerId);

    res.status(200).json({
      status: 'success',
      message: 'Session stopped successfully',
      data: {
        session,
      },
    });
  }),

  /**
   * Close session (Bonus feature)
   * PATCH /api/sessions/:id/close
   */
  closeSession: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const organizerId = req.organizer.id;

    const session = await sessionService.closeSession(id, organizerId);

    res.status(200).json({
      status: 'success',
      message: 'Session closed successfully',
      data: {
        session,
      },
    });
  }),

  /**
   * Delete session
   * DELETE /api/sessions/:id
   */
  deleteSession: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const organizerId = req.organizer.id;

    await sessionService.deleteSession(id, organizerId);

    res.status(200).json({
      status: 'success',
      message: 'Session deleted successfully',
    });
  }),
};