import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

// Define environment schema with Zod
const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3000'),
  HOST: z.string().default('0.0.0.0'),

  // Database
  DATABASE_URL: z.string().url(),

  // Redis
  REDIS_URL: z.string().url(),
  REDIS_PASSWORD: z.string().optional().default(''),

  // JWT
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRY: z.string().default('24h'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('60000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),

  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:3000'),

  // Vote Processing
  VOTE_QUEUE_BATCH_SIZE: z.string().transform(Number).default('10'),
  VOTE_PROCESS_INTERVAL_MS: z.string().transform(Number).default('1000'),

  // Session
  JOIN_CODE_LENGTH: z.string().transform(Number).default('8'),
  SESSION_CACHE_TTL: z.string().transform(Number).default('3600'),

  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});

// Parse and validate environment variables
function validateEnv() {
  try {
    const env = envSchema.parse(process.env);
    return env;
  } catch (error) {
    console.error('❌ Invalid environment variables:');
    console.error(error.errors);
    process.exit(1);
  }
}

export const env = validateEnv();