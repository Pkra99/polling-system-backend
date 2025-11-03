import { authService } from '../services/auth.service.js';
import { asyncHandler } from '../middleware/error.middleware.js';

export const authController = {
  /**
   * Register a new organizer
   * POST /api/auth/register
   */
  register: asyncHandler(async (req, res) => {
    const { email, password, name } = req.body;

    const result = await authService.register({ email, password, name });

    res.status(201).json({
      status: 'success',
      message: 'Organizer registered successfully',
      data: result,
    });
  }),

  /**
   * Login organizer
   * POST /api/auth/login
   */
  login: asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const result = await authService.login({ email, password });

    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      data: result,
    });
  }),

  /**
   * Get current organizer
   * GET /api/auth/me
   */
  getCurrentOrganizer: asyncHandler(async (req, res) => {
    // req.organizer is set by authenticate middleware
    const organizer = await authService.getOrganizerById(req.organizer.id);

    res.status(200).json({
      status: 'success',
      data: {
        organizer,
      },
    });
  }),
};