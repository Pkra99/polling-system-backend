import { z } from 'zod';

// Create session validation
export const createSessionSchema = z.object({
  body: z.object({
    title: z
      .string()
      .min(3, 'Title must be at least 3 characters')
      .max(255, 'Title must be at most 255 characters')
      .trim(),
    
    description: z
      .string()
      .max(1000, 'Description must be at most 1000 characters')
      .trim()
      .optional(),
  }),
});

// Update session validation
export const updateSessionSchema = z.object({
  body: z.object({
    title: z
      .string()
      .min(3, 'Title must be at least 3 characters')
      .max(255, 'Title must be at most 255 characters')
      .trim()
      .optional(),
    
    description: z
      .string()
      .max(1000, 'Description must be at most 1000 characters')
      .trim()
      .optional()
      .nullable(),
  }),
  params: z.object({
    id: z.string().uuid('Invalid session ID'),
  }),
});

// Get session by ID validation
export const getSessionSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid session ID'),
  }),
});

// Join code validation
export const joinCodeSchema = z.object({
  params: z.object({
    joinCode: z
      .string()
      .length(8, 'Join code must be 8 characters')
      .toUpperCase(),
  }),
});

// Pagination validation
export const paginationSchema = z.object({
  query: z.object({
    page: z
      .string()
      .optional()
      .default('1')
      .transform(Number)
      .refine((n) => n > 0, 'Page must be greater than 0'),
    
    limit: z
      .string()
      .optional()
      .default('50')
      .transform(Number)
      .refine((n) => n > 0 && n <= 100, 'Limit must be between 1 and 100'),
  }),
});