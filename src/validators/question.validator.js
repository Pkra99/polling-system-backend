import { z } from 'zod';

// Add question validation
export const addQuestionSchema = z.object({
  body: z.object({
    questionText: z
      .string()
      .min(5, 'Question must be at least 5 characters')
      .max(500, 'Question must be at most 500 characters')
      .trim(),
    
    options: z
      .array(
        z.string()
          .min(1, 'Option cannot be empty')
          .max(200, 'Option must be at most 200 characters')
          .trim()
      )
      .min(2, 'Question must have at least 2 options')
      .max(10, 'Question cannot have more than 10 options'),
  }),
  params: z.object({
    sessionId: z.string().uuid('Invalid session ID'),
  }),
});

// Update question validation
export const updateQuestionSchema = z.object({
  body: z.object({
    questionText: z
      .string()
      .min(5, 'Question must be at least 5 characters')
      .max(500, 'Question must be at most 500 characters')
      .trim()
      .optional(),
    
    options: z
      .array(
        z.string()
          .min(1, 'Option cannot be empty')
          .max(200, 'Option must be at most 200 characters')
          .trim()
      )
      .min(2, 'Question must have at least 2 options')
      .max(10, 'Question cannot have more than 10 options')
      .optional(),
  }),
  params: z.object({
    questionId: z.string().uuid('Invalid question ID'),
  }),
});

// Get question validation
export const getQuestionSchema = z.object({
  params: z.object({
    questionId: z.string().uuid('Invalid question ID'),
  }),
});

// Get session questions validation
export const getSessionQuestionsSchema = z.object({
  params: z.object({
    sessionId: z.string().uuid('Invalid session ID'),
  }),
});

// Reorder questions validation
export const reorderQuestionsSchema = z.object({
  body: z.object({
    questionOrders: z
      .array(
        z.object({
          questionId: z.string().uuid('Invalid question ID'),
          order: z.number().int().min(0, 'Order must be non-negative'),
        })
      )
      .min(1, 'At least one question order must be provided'),
  }),
  params: z.object({
    sessionId: z.string().uuid('Invalid session ID'),
  }),
});