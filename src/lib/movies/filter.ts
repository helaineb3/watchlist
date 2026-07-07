export type FilterableMovie = {
	title: string;
	releaseYear: string | null;
};

export function movieMatchesQuery(movie: FilterableMovie, query: string): boolean {
	const trimmed = query.trim().toLowerCase();
	if (!trimmed) return true;

	const haystack = `${movie.title} ${movie.releaseYear ?? ''}`.toLowerCase();
	return haystack.includes(trimmed);
}

export function filterMovies<T extends FilterableMovie>(movies: T[], query: string): T[] {
	return movies.filter((movie) => movieMatchesQuery(movie, query));
}
