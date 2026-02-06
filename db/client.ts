import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';

/**
 * Create a Turso/libSQL database client
 * 
 * Environment variables:
 * - TURSO_DATABASE_URL: Your Turso database URL
 * - TURSO_AUTH_TOKEN: Authentication token (optional for local dev)
 */
function createDbClient() {
  const url = process.env.TURSO_DATABASE_URL;
  
  if (!url) {
    throw new Error('TURSO_DATABASE_URL environment variable is required');
  }
  
  const client = createClient({
    url,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  
  return drizzle(client, { schema });
}

// Singleton pattern for connection reuse
let db: ReturnType<typeof createDbClient> | null = null;

export function getDb() {
  if (!db) {
    db = createDbClient();
  }
  return db;
}

// For direct import in server components/actions
export const database = {
  get instance() {
    return getDb();
  },
};

// Re-export schema for convenience
export { schema };
export * from './schema';
