import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { searchMovies } from '$lib/server/tmdb';

export const GET: RequestHandler = async ({ url, locals }) => {
	if (!locals.user) {
		error(401, 'Unauthorized');
	}

	const query = url.searchParams.get('q') ?? '';

	try {
		const results = await searchMovies(query);
		return json({ results });
	} catch (err) {
		console.error('TMDB search error:', err);
		error(502, 'Failed to search TMDB');
	}
};
