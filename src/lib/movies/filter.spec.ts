import { describe, expect, it } from 'vitest';
import { filterMovies, movieMatchesQuery } from './filter';

describe('movieMatchesQuery', () => {
	it('matches title and year', () => {
		expect(movieMatchesQuery({ title: 'Finding Nemo', releaseYear: '2003' }, 'nemo')).toBe(true);
		expect(movieMatchesQuery({ title: 'Finding Nemo', releaseYear: '2003' }, '2003')).toBe(true);
		expect(movieMatchesQuery({ title: 'Up', releaseYear: '2009' }, 'dory')).toBe(false);
	});

	it('returns all movies for an empty query', () => {
		expect(movieMatchesQuery({ title: 'Up', releaseYear: '2009' }, '   ')).toBe(true);
	});
});

describe('filterMovies', () => {
	it('filters a movie list', () => {
		const movies = [
			{ id: 1, title: 'Up', releaseYear: '2009' },
			{ id: 2, title: 'Toy Story', releaseYear: '1995' }
		];

		expect(filterMovies(movies, 'toy')).toEqual([movies[1]]);
	});
});
