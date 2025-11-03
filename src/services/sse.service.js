import { redisSubClient } from '../config/redis.js';
import { logger } from '../utils/logger.js';

class SSEManager {
  constructor() {
    this.connections = new Map(); // sessionId -> Set of response objects
    this.initialized = false;
  }

  /**
   * Initialize Redis pub/sub listeners
   */
  async initialize() {
    if (this.initialized) return;

    try {
      // Subscribe to all result update channels
      await redisSubClient.pSubscribe('results:*', (message, channel) => {
        const sessionId = channel.split(':')[1];
        this.broadcastToSession(sessionId, message);
      });

      this.initialized = true;
      logger.info('SSE Manager initialized');
    } catch (error) {
      logger.error('Failed to initialize SSE Manager', { error: error.message });
    }
  }

  /**
   * Add a client connection
   */
  addConnection(sessionId, res) {
    if (!this.connections.has(sessionId)) {
      this.connections.set(sessionId, new Set());
    }

    this.connections.get(sessionId).add(res);

    logger.info('SSE client connected', {
      sessionId,
      totalConnections: this.connections.get(sessionId).size,
    });

    // Send initial connection confirmation
    this.sendToClient(res, {
      type: 'connected',
      sessionId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Remove a client connection
   */
  removeConnection(sessionId, res) {
    if (this.connections.has(sessionId)) {
      this.connections.get(sessionId).delete(res);

      if (this.connections.get(sessionId).size === 0) {
        this.connections.delete(sessionId);
      }

      logger.info('SSE client disconnected', {
        sessionId,
        remainingConnections: this.connections.get(sessionId)?.size || 0,
      });
    }
  }

  /**
   * Send message to a specific client
   */
  sendToClient(res, data) {
    try {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch (error) {
      logger.error('Failed to send SSE message to client', { error: error.message });
    }
  }

  /**
   * Broadcast message to all clients of a session
   */
  broadcastToSession(sessionId, message) {
    const clients = this.connections.get(sessionId);
    
    if (!clients || clients.size === 0) {
      return;
    }

    let data;
    try {
      data = typeof message === 'string' ? JSON.parse(message) : message;
    } catch (error) {
      logger.error('Failed to parse broadcast message', { error: error.message });
      return;
    }

    const deadConnections = [];

    clients.forEach(res => {
      try {
        this.sendToClient(res, data);
      } catch (error) {
        // Connection is dead, mark for removal
        deadConnections.push(res);
      }
    });

    // Clean up dead connections
    deadConnections.forEach(res => {
      this.removeConnection(sessionId, res);
    });

    logger.debug('Broadcast to session', {
      sessionId,
      clients: clients.size,
      deadConnections: deadConnections.length,
    });
  }

  /**
   * Send keep-alive ping to all connections
   */
  sendKeepAlive() {
    const deadConnections = [];

    this.connections.forEach((clients, sessionId) => {
      clients.forEach(res => {
        try {
          res.write(': keep-alive\n\n');
        } catch (error) {
          deadConnections.push({ sessionId, res });
        }
      });
    });

    // Clean up dead connections
    deadConnections.forEach(({ sessionId, res }) => {
      this.removeConnection(sessionId, res);
    });

    if (deadConnections.length > 0) {
      logger.debug('Keep-alive cleanup', { removed: deadConnections.length });
    }
  }

  /**
   * Get connection stats
   */
  getStats() {
    const stats = {
      totalSessions: this.connections.size,
      totalConnections: 0,
      sessions: [],
    };

    this.connections.forEach((clients, sessionId) => {
      stats.totalConnections += clients.size;
      stats.sessions.push({
        sessionId,
        connections: clients.size,
      });
    });

    return stats;
  }
}

// Singleton instance
export const sseManager = new SSEManager();

// Start keep-alive interval (every 30 seconds)
setInterval(() => {
  sseManager.sendKeepAlive();
}, 30000);