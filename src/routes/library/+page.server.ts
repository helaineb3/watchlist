import { fail, redirect } from '@sveltejs/kit';
import { and, desc, eq, isNull } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { auth } from '$lib/server/auth';
import { parseCsvMovies } from '$lib/server/csv';
import { db } from '$lib/server/db';
import { movie, ownedMovie } from '$lib/server/db/schema';
import { matchMoviesForImport } from '$lib/server/tmdb';
import { watchlistKey } from '$lib/movies/watchlist';

const MAX_IMPORT_ROWS = 50;
const MAX_FILE_BYTES = 256 * 1024;

function parseOptionalString(value: FormDataEntryValue | null) {
	const parsed = value?.toString().trim();
	return parsed || null;
}

function parseOptionalInt(value: FormDataEntryValue | null) {
	const parsed = Number(value);
	if (!Number.isInteger(parsed) || parsed <= 0) return null;
	return parsed;
}

function parseRating(value: FormDataEntryValue | null) {
	const raw = value?.toString().trim() ?? '';
	if (!raw) return null;
	const parsed = Number(raw);
	if (!Number.isInteger(parsed) || parsed < 1 || parsed > 5) return null;
	return parsed;
}

export const load: PageServerLoad = async (event) => {
	if (!event.locals.user) {
		return redirect(302, '/login');
	}

	const movies = await db
		.select()
		.from(ownedMovie)
		.where(eq(ownedMovie.userId, event.locals.user.id))
		.orderBy(desc(ownedMovie.createdAt));

	const watchlistRows = await db
		.select({
			id: movie.id,
			title: movie.title,
			releaseYear: movie.releaseYear,
			tmdbId: movie.tmdbId,
			rating: movie.rating,
			watched: movie.watched
		})
		.from(movie)
		.where(eq(movie.userId, event.locals.user.id));

	const watchlistEntries = watchlistRows.map((entry) => ({
		key: watchlistKey(entry.title, entry.releaseYear, entry.tmdbId),
		watchlistId: entry.id,
		rating: entry.rating,
		watched: entry.watched
	}));

	return { user: event.locals.user, movies, watchlistEntries };
};

export const actions: Actions = {
	addOwnedMovie: async (event) => {
		if (!event.locals.user) {
			return redirect(302, '/login');
		}

		const formData = await event.request.formData();
		const title = formData.get('title')?.toString().trim() ?? '';

		if (!title) {
			return fail(400, { message: 'Title is required' });
		}

		if (title.length > 200) {
			return fail(400, { message: 'Title must be 200 characters or less' });
		}

		await db.insert(ownedMovie).values({
			userId: event.locals.user.id,
			title,
			tmdbId: parseOptionalInt(formData.get('tmdbId')),
			posterPath: parseOptionalString(formData.get('posterPath')),
			releaseYear: parseOptionalString(formData.get('releaseYear'))
		});

		return { success: true };
	},
	importCsv: async (event) => {
		if (!event.locals.user) {
			return redirect(302, '/login');
		}

		const formData = await event.request.formData();
		const file = formData.get('csv');

		if (!(file instanceof File)) {
			return fail(400, { message: 'Choose a CSV file to import.' });
		}

		if (!file.name.toLowerCase().endsWith('.csv') && file.type !== 'text/csv') {
			return fail(400, { message: 'Upload a .csv file with title and year columns.' });
		}

		if (file.size === 0) {
			return fail(400, { message: 'That CSV file is empty.' });
		}

		if (file.size > MAX_FILE_BYTES) {
			return fail(400, { message: 'CSV file must be 256 KB or smaller.' });
		}

		const rows = parseCsvMovies(await file.text());

		if (rows.length === 0) {
			return fail(400, {
				message: 'No movies found. Use a header row with title and year columns.'
			});
		}

		if (rows.length > MAX_IMPORT_ROWS) {
			return fail(400, {
				message: `Import up to ${MAX_IMPORT_ROWS} movies at a time (${rows.length} found).`
			});
		}

		const matched = await matchMoviesForImport(rows);
		const matchedCount = matched.filter((movie) => movie.tmdbId !== null).length;

		await db.delete(ownedMovie).where(eq(ownedMovie.userId, event.locals.user.id));

		await db.insert(ownedMovie).values(
			matched.map((movie) => ({
				userId: event.locals.user!.id,
				title: movie.title,
				tmdbId: movie.tmdbId,
				posterPath: movie.posterPath,
				releaseYear: movie.releaseYear
			}))
		);

		return {
			success: true,
			importSummary: {
				total: matched.length,
				matched: matchedCount,
				unmatched: matched.length - matchedCount
			}
		};
	},
	addToWatchlist: async (event) => {
		if (!event.locals.user) {
			return redirect(302, '/login');
		}

		const formData = await event.request.formData();
		const id = Number(formData.get('id'));

		if (!Number.isInteger(id) || id <= 0) {
			return fail(400, { message: 'Invalid movie' });
		}

		const [owned] = await db
			.select()
			.from(ownedMovie)
			.where(and(eq(ownedMovie.id, id), eq(ownedMovie.userId, event.locals.user.id)));

		if (!owned) {
			return fail(404, { message: 'Movie not found in your collection.' });
		}

		if (owned.tmdbId) {
			const [existing] = await db
				.select({ id: movie.id })
				.from(movie)
				.where(and(eq(movie.userId, event.locals.user.id), eq(movie.tmdbId, owned.tmdbId)))
				.limit(1);

			if (existing) {
				return fail(400, { message: `${owned.title} is already on your watchlist.` });
			}
		} else {
			const titleMatch = owned.releaseYear
				? and(
						eq(movie.userId, event.locals.user.id),
						eq(movie.title, owned.title),
						eq(movie.releaseYear, owned.releaseYear)
					)
				: and(
						eq(movie.userId, event.locals.user.id),
						eq(movie.title, owned.title),
						isNull(movie.releaseYear)
					);

			const [existing] = await db.select({ id: movie.id }).from(movie).where(titleMatch).limit(1);

			if (existing) {
				return fail(400, { message: `${owned.title} is already on your watchlist.` });
			}
		}

		await db.insert(movie).values({
			userId: event.locals.user.id,
			title: owned.title,
			tmdbId: owned.tmdbId,
			posterPath: owned.posterPath,
			releaseYear: owned.releaseYear,
			rating: parseRating(formData.get('rating'))
		});

		return { success: true, watchlistMessage: `Added ${owned.title} to your watchlist.` };
	},
	updateWatchlistRating: async (event) => {
		if (!event.locals.user) {
			return redirect(302, '/login');
		}

		const formData = await event.request.formData();
		const watchlistId = Number(formData.get('watchlistId'));

		if (!Number.isInteger(watchlistId) || watchlistId <= 0) {
			return fail(400, { message: 'Invalid watchlist movie' });
		}

		const [updated] = await db
			.update(movie)
			.set({ rating: parseRating(formData.get('rating')) })
			.where(and(eq(movie.id, watchlistId), eq(movie.userId, event.locals.user.id)))
			.returning({ title: movie.title });

		if (!updated) {
			return fail(404, { message: 'Watchlist movie not found.' });
		}

		return {
			success: true,
			watchlistMessage: `Updated rating for ${updated.title}.`
		};
	},
	toggleWatched: async (event) => {
		if (!event.locals.user) {
			return redirect(302, '/login');
		}

		const formData = await event.request.formData();
		const watchlistId = Number(formData.get('watchlistId'));

		if (!Number.isInteger(watchlistId) || watchlistId <= 0) {
			return fail(400, { message: 'Invalid watchlist movie' });
		}

		const [current] = await db
			.select({ watched: movie.watched, title: movie.title })
			.from(movie)
			.where(and(eq(movie.id, watchlistId), eq(movie.userId, event.locals.user.id)))
			.limit(1);

		if (!current) {
			return fail(404, { message: 'Watchlist movie not found.' });
		}

		await db
			.update(movie)
			.set({ watched: !current.watched })
			.where(and(eq(movie.id, watchlistId), eq(movie.userId, event.locals.user.id)));

		return {
			success: true,
			watchlistMessage: current.watched
				? `Moved ${current.title} back to your watchlist.`
				: `Marked ${current.title} as watched.`
		};
	},
	deleteOwnedMovie: async (event) => {
		if (!event.locals.user) {
			return redirect(302, '/login');
		}

		const formData = await event.request.formData();
		const id = Number(formData.get('id'));

		if (!Number.isInteger(id) || id <= 0) {
			return fail(400, { message: 'Invalid movie' });
		}

		await db
			.delete(ownedMovie)
			.where(and(eq(ownedMovie.id, id), eq(ownedMovie.userId, event.locals.user.id)));

		return { success: true };
	},
	signOut: async (event) => {
		await auth.api.signOut({
			headers: event.request.headers
		});
		return redirect(302, '/login');
	}
};
