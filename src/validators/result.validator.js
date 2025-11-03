import { z } from 'zod';

// Get results by join code
export const getResultsSchema = z.object({
  params: z.object({
    joinCode: z
      .string()
      .length(8, 'Join code must be 8 characters')
      .toUpperCase(),
  }),
});