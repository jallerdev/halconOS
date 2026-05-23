import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import { env } from '../../env';
import * as schema from './schema';

const globalForDb = globalThis as unknown as {
  client?: ReturnType<typeof postgres>;
};

const client =
  globalForDb.client ??
  postgres(env.DATABASE_URL, {
    max: env.NODE_ENV === 'production' ? 10 : 1,
    prepare: false,
  });

if (env.NODE_ENV !== 'production') globalForDb.client = client;

export const db = drizzle(client, { schema, casing: 'snake_case' });
export type DB = typeof db;
export { schema };
