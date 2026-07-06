import { env } from '$env/dynamic/private';

const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w342';

export type TmdbSearchResult = {
	id: number;
	title: string;
	posterUrl: string | null;
	releaseYear: string | null;
};

type TmdbSearchResponse = {
	results: Array<{
		id: number;
		title: string;
		poster_path: string | null;
		release_date: string;
	}>;
};

function getAccessToken() {
	const token = env.TMDB_API_KEY;
	if (!token) {
		throw new Error('TMDB_API_KEY is not set');
	}
	return token;
}

export function posterUrlFromPath(posterPath: string | null | undefined): string | null {
	if (!posterPath) return null;
	if (posterPath.startsWith('http')) return posterPath;
	return `${TMDB_IMAGE_BASE}${posterPath}`;
}

export function releaseYearFromDate(releaseDate: string | undefined): string | null {
	if (!releaseDate) return null;
	const year = releaseDate.slice(0, 4);
	return year || null;
}

export async function searchMovies(query: string): Promise<TmdbSearchResult[]> {
	const trimmed = query.trim();
	if (trimmed.length < 2) return [];

	const url = new URL(`${TMDB_BASE}/search/movie`);
	url.searchParams.set('query', trimmed);
	url.searchParams.set('include_adult', 'false');
	url.searchParams.set('language', 'en-US');

	const response = await fetch(url, {
		headers: {
			Authorization: `Bearer ${getAccessToken()}`,
			Accept: 'application/json'
		}
	});

	if (!response.ok) {
		throw new Error(`TMDB search failed (${response.status})`);
	}

	const data = (await response.json()) as TmdbSearchResponse;

	return data.results.slice(0, 8).map((result) => ({
		id: result.id,
		title: result.title,
		posterUrl: posterUrlFromPath(result.poster_path),
		releaseYear: releaseYearFromDate(result.release_date)
	}));
}
