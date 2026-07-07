export function watchlistKey(
	title: string,
	releaseYear: string | null,
	tmdbId: number | null
): string {
	if (tmdbId) return `tmdb:${tmdbId}`;
	return `title:${title.trim().toLowerCase()}|${releaseYear ?? ''}`;
}

export type WatchlistEntrySummary = {
	key: string;
	watchlistId: number;
	rating: number | null;
	watched: boolean;
};

export function watchlistEntryForMovie(
	movie: { title: string; releaseYear: string | null; tmdbId: number | null },
	entries: WatchlistEntrySummary[]
) {
	const key = watchlistKey(movie.title, movie.releaseYear, movie.tmdbId);
	return entries.find((entry) => entry.key === key) ?? null;
}
