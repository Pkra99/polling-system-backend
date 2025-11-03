import app from './app.js';
import { env } from './config/env.js';
import { testConnection, closeDatabase } from './config/database.js';
import { connectRedis, disconnectRedis } from './config/redis.js';
import { logger } from './utils/logger.js';

let server;

async function startServer() {
  try {
    // Test database connection
    logger.info('Testing database connection...');
    const dbConnected = await testConnection();
    if (!dbConnected) {
      throw new Error('Database connection failed');
    }

    // Connect to Redis
    logger.info('Connecting to Redis...');
    const redisConnected = await connectRedis();
    if (!redisConnected) {
      throw new Error('Redis connection failed');
    }

    // Start Express server
    server = app.listen(env.PORT, env.HOST, () => {
      logger.info(`Server running on http://${env.HOST}:${env.PORT}`);
      logger.info(`Environment: ${env.NODE_ENV}`);
      logger.info('Press CTRL+C to stop');
    });

  } catch (error) {
    logger.error('Failed to start server:', { error: error.message });
    process.exit(1);
  }
}

// Graceful shutdown
async function shutdown(signal) {
  logger.info(`\n${signal} received. Starting graceful shutdown...`);

  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed');

      // Close database connection
      await closeDatabase();
      
      // Close Redis connections
      await disconnectRedis();

      logger.info('All connections closed. Exiting...');
      process.exit(0);
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  }
}

// Handle shutdown signals
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', { error: error.message, stack: error.stack });
  shutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection:', { reason, promise });
  shutdown('unhandledRejection');
});

// Start the server
startServer();
