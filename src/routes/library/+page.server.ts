import { fail, redirect } from '@sveltejs/kit';
import { and, desc, eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { auth } from '$lib/server/auth';
import { parseCsvMovies } from '$lib/server/csv';
import { db } from '$lib/server/db';
import { ownedMovie } from '$lib/server/db/schema';
import { matchMoviesForImport } from '$lib/server/tmdb';

const MAX_IMPORT_ROWS = 50;
const MAX_FILE_BYTES = 256 * 1024;

export const load: PageServerLoad = async (event) => {
	if (!event.locals.user) {
		return redirect(302, '/login');
	}

	const movies = await db
		.select()
		.from(ownedMovie)
		.where(eq(ownedMovie.userId, event.locals.user.id))
		.orderBy(desc(ownedMovie.createdAt));

	return { user: event.locals.user, movies };
};

export const actions: Actions = {
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
