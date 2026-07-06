import { defineConfig } from 'drizzle-kit';
import { readFileSync } from 'node:fs';

if (!process.env.DATABASE_URL) {
	const envFile = readFileSync('.env', 'utf8');
	const match = envFile.match(/^DATABASE_URL=(.*)$/m);
	if (match) {
		process.env.DATABASE_URL = match[1].replace(/^"|"$/g, '');
	}
}

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

export default defineConfig({
	schema: './src/lib/server/db/schema.ts',
	out: './drizzle',
	dialect: 'postgresql',
	dbCredentials: { url: process.env.DATABASE_URL },
	verbose: true,
	strict: true
});
