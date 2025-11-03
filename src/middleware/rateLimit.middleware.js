import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  message: {
    status: 'error',
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiter for authentication endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: {
    status: 'error',
    message: 'Too many authentication attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Voting rate limiter (more lenient)
export const voteLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 votes per minute
  message: {
    status: 'error',
    message: 'Too many votes submitted, please slow down.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public endpoints rate limiter
export const publicLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: {
    status: 'error',
    message: 'Too many requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});