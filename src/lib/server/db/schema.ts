import { pgTable, serial, text, timestamp, index, integer, boolean } from 'drizzle-orm/pg-core';
import { user } from './auth.schema';

export const movie = pgTable(
	'movie',
	{
		id: serial('id').primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		title: text('title').notNull(),
		tmdbId: integer('tmdb_id'),
		posterPath: text('poster_path'),
		releaseYear: text('release_year'),
		rating: integer('rating'),
		watched: boolean('watched').notNull().default(false),
		createdAt: timestamp('created_at').defaultNow().notNull()
	},
	(table) => [index('movie_userId_idx').on(table.userId)]
);

export const ownedMovie = pgTable(
	'owned_movie',
	{
		id: serial('id').primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		title: text('title').notNull(),
		tmdbId: integer('tmdb_id'),
		posterPath: text('poster_path'),
		releaseYear: text('release_year'),
		createdAt: timestamp('created_at').defaultNow().notNull()
	},
	(table) => [index('owned_movie_userId_idx').on(table.userId)]
);

export * from './auth.schema';
