import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from '../db/schema/index.js';
import { env } from './env.js';

const { Pool } = pg;

// Ensure DATABASE_URL is a string
const databaseUrl = String(env.DATABASE_URL || '').trim();

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not defined in environment variables');
}

console.log('Connecting to database...'); // Debug log
console.log('Database URL format check:', databaseUrl.substring(0, 25) + '...'); // Show first part only

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: databaseUrl,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Create Drizzle instance
export const db = drizzle(pool, { schema });

// Test connection function
export async function testConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('✅ Database connected successfully at:', result.rows[0].now);
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Connection string format:', databaseUrl.split('@')[1]); // Show host part only
    return false;
  }
}

// Graceful shutdown
export async function closeDatabase() {
  await pool.end();
  console.log('Database pool has ended');
}
