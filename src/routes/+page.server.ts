import { and, desc, eq } from 'drizzle-orm';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { auth } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { movie } from '$lib/server/db/schema';

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
		.from(movie)
		.where(eq(movie.userId, event.locals.user.id))
		.orderBy(desc(movie.createdAt));

	return { user: event.locals.user, movies };
};

export const actions: Actions = {
	addMovie: async (event) => {
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

		await db.insert(movie).values({
			userId: event.locals.user.id,
			title,
			tmdbId: parseOptionalInt(formData.get('tmdbId')),
			posterPath: parseOptionalString(formData.get('posterPath')),
			releaseYear: parseOptionalString(formData.get('releaseYear')),
			rating: parseRating(formData.get('rating'))
		});

		return { success: true };
	},
	updateRating: async (event) => {
		if (!event.locals.user) {
			return redirect(302, '/login');
		}

		const formData = await event.request.formData();
		const id = Number(formData.get('id'));

		if (!Number.isInteger(id) || id <= 0) {
			return fail(400, { message: 'Invalid movie' });
		}

		const [updated] = await db
			.update(movie)
			.set({ rating: parseRating(formData.get('rating')) })
			.where(and(eq(movie.id, id), eq(movie.userId, event.locals.user.id)))
			.returning({ title: movie.title });

		if (!updated) {
			return fail(404, { message: 'Movie not found.' });
		}

		return { success: true };
	},
	toggleWatched: async (event) => {
		if (!event.locals.user) {
			return redirect(302, '/login');
		}

		const formData = await event.request.formData();
		const id = Number(formData.get('id'));

		if (!Number.isInteger(id) || id <= 0) {
			return fail(400, { message: 'Invalid movie' });
		}

		const [current] = await db
			.select({ watched: movie.watched, title: movie.title })
			.from(movie)
			.where(and(eq(movie.id, id), eq(movie.userId, event.locals.user.id)))
			.limit(1);

		if (!current) {
			return fail(404, { message: 'Movie not found.' });
		}

		await db
			.update(movie)
			.set({ watched: !current.watched })
			.where(and(eq(movie.id, id), eq(movie.userId, event.locals.user.id)));

		return {
			success: true,
			message: current.watched
				? `Moved ${current.title} back to your watchlist.`
				: `Marked ${current.title} as watched.`
		};
	},
	deleteMovie: async (event) => {
		if (!event.locals.user) {
			return redirect(302, '/login');
		}

		const formData = await event.request.formData();
		const id = Number(formData.get('id'));

		if (!Number.isInteger(id) || id <= 0) {
			return fail(400, { message: 'Invalid movie' });
		}

		await db
			.delete(movie)
			.where(and(eq(movie.id, id), eq(movie.userId, event.locals.user.id)));

		return { success: true };
	},
	signOut: async (event) => {
		await auth.api.signOut({
			headers: event.request.headers
		});
		return redirect(302, '/login');
	}
};
