import { describe, expect, it } from 'vitest';
import { parseCsvMovies } from './csv';

describe('parseCsvMovies', () => {
	it('parses title and year columns from a header row', () => {
		const rows = parseCsvMovies(`title,year
The Lion King,1994
Finding Nemo,2003`);

		expect(rows).toEqual([
			{ title: 'The Lion King', releaseYear: '1994' },
			{ title: 'Finding Nemo', releaseYear: '2003' }
		]);
	});

	it('supports quoted titles and alternate headers', () => {
		const rows = parseCsvMovies(`name,release_year
"Heat, Special Edition",1995`);

		expect(rows).toEqual([{ title: 'Heat, Special Edition', releaseYear: '1995' }]);
	});

	it('falls back to first two columns when headers are missing', () => {
		const rows = parseCsvMovies(`Up,2009`);

		expect(rows).toEqual([{ title: 'Up', releaseYear: '2009' }]);
	});
});
