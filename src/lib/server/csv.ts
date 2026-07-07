export type CsvMovieRow = {
	title: string;
	releaseYear: string | null;
};

const TITLE_HEADERS = new Set(['title', 'name', 'movie', 'movie title']);
const YEAR_HEADERS = new Set(['year', 'release_year', 'release year', 'releaseyear']);

function normalizeHeader(value: string) {
	return value.trim().toLowerCase().replace(/[_-]+/g, ' ');
}

function parseCsvLine(line: string): string[] {
	const values: string[] = [];
	let current = '';
	let inQuotes = false;

	for (let index = 0; index < line.length; index += 1) {
		const char = line[index];

		if (char === '"') {
			if (inQuotes && line[index + 1] === '"') {
				current += '"';
				index += 1;
			} else {
				inQuotes = !inQuotes;
			}
			continue;
		}

		if (char === ',' && !inQuotes) {
			values.push(current.trim());
			current = '';
			continue;
		}

		current += char;
	}

	values.push(current.trim());
	return values;
}

function findColumnIndex(headers: string[], candidates: Set<string>): number {
	return headers.findIndex((header) => candidates.has(normalizeHeader(header)));
}

function normalizeYear(value: string | undefined): string | null {
	if (!value) return null;
	const match = value.trim().match(/\d{4}/);
	return match?.[0] ?? null;
}

export function parseCsvMovies(content: string): CsvMovieRow[] {
	const text = content.replace(/^\uFEFF/, '').trim();
	if (!text) return [];

	const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
	if (lines.length === 0) return [];

	const headers = parseCsvLine(lines[0]).map((header) => normalizeHeader(header));
	const titleIndex = findColumnIndex(headers, TITLE_HEADERS);
	const yearIndex = findColumnIndex(headers, YEAR_HEADERS);

	const rows: CsvMovieRow[] = [];
	const startIndex = titleIndex >= 0 ? 1 : 0;
	const resolvedTitleIndex = titleIndex >= 0 ? titleIndex : 0;
	const resolvedYearIndex = yearIndex >= 0 ? yearIndex : 1;

	for (const line of lines.slice(startIndex)) {
		const columns = parseCsvLine(line);
		const title = columns[resolvedTitleIndex]?.trim() ?? '';

		if (!title) continue;

		const releaseYear =
			yearIndex >= 0 ? normalizeYear(columns[resolvedYearIndex]) : normalizeYear(columns[1]);

		rows.push({ title, releaseYear });
	}

	return rows;
}
