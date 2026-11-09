import { execSync } from 'child_process';
import { Client } from 'pg';

import { getTestDatabaseUrl } from './utils/test-env';

export default async function globalSetup(): Promise<void> {
  const databaseUrl = getTestDatabaseUrl();

  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: 'ignore',
  });

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    const { rows } = await client.query<{ tablename: string }>(
      `SELECT tablename FROM pg_tables
       WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`,
    );

    if (rows.length > 0) {
      const tables = rows.map(({ tablename }) => `"${tablename}"`).join(', ');
      await client.query(`TRUNCATE TABLE ${tables} CASCADE`);
    }
  } finally {
    await client.end();
  }
}
