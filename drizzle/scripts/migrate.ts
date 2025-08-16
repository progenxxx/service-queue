import 'dotenv/config';
import { db } from '../../src/lib/db';
import { migrate } from 'drizzle-orm/postgres-js/migrator';

async function runMigrations() {
  try {
    await migrate(db, { migrationsFolder: './drizzle' });
  } catch (error) {
    process.exit(1);
  }
}

if (require.main === module) {
  runMigrations().then(() => process.exit(0));
}