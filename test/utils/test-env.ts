import { config } from 'dotenv';

// e2e suites run against `<db>_test` next to the dev database so they never touch dev data.
export function getTestDatabaseUrl(): string {
  config({ quiet: true });

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL must be set to run e2e tests');
  }

  const url = new URL(databaseUrl);
  url.pathname = `${url.pathname}_test`;

  return url.toString();
}
