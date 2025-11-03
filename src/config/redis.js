import { createClient } from 'redis';
import { env } from './env.js';

// Create Redis client
const redisClient = createClient({
  url: env.REDIS_URL,
  password: env.REDIS_PASSWORD || undefined,
});

// Create Redis client for pub/sub (separate connection)
const redisPubClient = createClient({
  url: env.REDIS_URL,
  password: env.REDIS_PASSWORD || undefined,
});

const redisSubClient = createClient({
  url: env.REDIS_URL,
  password: env.REDIS_PASSWORD || undefined,
});

// Error handling
redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

redisPubClient.on('error', (err) => {
  console.error('Redis Pub Client Error:', err);
});

redisSubClient.on('error', (err) => {
  console.error('Redis Sub Client Error:', err);
});

// Connection events
redisClient.on('connect', () => {
  console.log('✅ Redis client connected');
});

redisPubClient.on('connect', () => {
  console.log('✅ Redis pub client connected');
});

redisSubClient.on('connect', () => {
  console.log('✅ Redis sub client connected');
});

// Connect all clients
export async function connectRedis() {
  try {
    await Promise.all([
      redisClient.connect(),
      redisPubClient.connect(),
      redisSubClient.connect(),
    ]);
    console.log('✅ All Redis clients connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Redis connection failed:', error.message);
    return false;
  }
}

// Disconnect all clients
export async function disconnectRedis() {
  try {
    await Promise.all([
      redisClient.quit(),
      redisPubClient.quit(),
      redisSubClient.quit(),
    ]);
    console.log('Redis clients disconnected');
  } catch (error) {
    console.error('Error disconnecting Redis:', error.message);
  }
}

// Export clients
export { redisClient, redisPubClient, redisSubClient };

// Redis helper functions
export const redis = {
  // Cache operations
  async get(key) {
    return await redisClient.get(key);
  },

  async set(key, value, ttl = null) {
    if (ttl) {
      return await redisClient.setEx(key, ttl, value);
    }
    return await redisClient.set(key, value);
  },

  async del(key) {
    return await redisClient.del(key);
  },

  async exists(key) {
    return await redisClient.exists(key);
  },

  // JSON operations
  async getJSON(key) {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  },

  async setJSON(key, value, ttl = null) {
    const serialized = JSON.stringify(value);
    if (ttl) {
      return await redisClient.setEx(key, ttl, serialized);
    }
    return await redisClient.set(key, serialized);
  },

  // Queue operations
  async lpush(key, value) {
    return await redisClient.lPush(key, value);
  },

  async rpop(key) {
    return await redisClient.rPop(key);
  },

  async llen(key) {
    return await redisClient.lLen(key);
  },

  async lrange(key, start, stop) {
    return await redisClient.lRange(key, start, stop);
  },

  // Pub/Sub operations
  async publish(channel, message) {
    return await redisPubClient.publish(channel, message);
  },

  async subscribe(channel, callback) {
    await redisSubClient.subscribe(channel, (message) => {
      callback(message);
    });
  },

  async unsubscribe(channel) {
    await redisSubClient.unsubscribe(channel);
  },
};