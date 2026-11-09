import { getTestDatabaseUrl } from './utils/test-env';

process.env.DATABASE_URL = getTestDatabaseUrl();
process.env.NODE_ENV = 'test';
