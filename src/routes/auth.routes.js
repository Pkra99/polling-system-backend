import express from 'express';
import { authController } from '../controllers/auth.controller.js';
import { validate } from '../middleware/validation.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { registerSchema, loginSchema } from '../validators/auth.validator.js';
import { authLimiter } from '../middleware/rateLimit.middleware.js';

const router = express.Router();

// Apply strict rate limiting to auth endpoints
router.use(authLimiter);

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.get('/me', authenticate, authController.getCurrentOrganizer);

export default router;