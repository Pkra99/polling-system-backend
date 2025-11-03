import { z } from 'zod';

// Submit votes validation
export const submitVotesSchema = z.object({
  body: z.object({
    votes: z
      .array(
        z.object({
          questionId: z.string().uuid('Invalid question ID'),
          optionId: z.string().uuid('Invalid option ID'),
        })
      )
      .min(1, 'At least one vote is required')
      .max(50, 'Cannot submit more than 50 votes at once'),
  }),
  params: z.object({
    joinCode: z
      .string()
      .length(8, 'Join code must be 8 characters')
      .toUpperCase(),
  }),
});

// Get voting status validation
export const getVotingStatusSchema = z.object({
  params: z.object({
    joinCode: z
      .string()
      .length(8, 'Join code must be 8 characters')
      .toUpperCase(),
  }),
});