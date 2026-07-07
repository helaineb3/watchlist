export type MondrianColor = 'red' | 'blue' | 'yellow' | 'white';

export type MondrianSpan = {
	col: number;
	row: number;
};

export type MondrianBlock = {
	kind: 'block';
	color: MondrianColor;
	span: MondrianSpan;
};

export type MondrianMovieCell = {
	kind: 'movie';
	id: number;
	span: MondrianSpan;
};

export type MondrianCell = MondrianBlock | MondrianMovieCell;

export type PlacedMondrianCell = MondrianCell & {
	col: number;
	row: number;
	colSpan: number;
	rowSpan: number;
};

export type MovieForLayout = {
	id: number;
	title: string;
	releaseYear: string | null;
};

export type MondrianViewportLayout = {
	outer: PlacedMondrianCell[];
	inner: PlacedMondrianCell[];
	viewportRows: number;
	panelRowSpan: number;
	compositionRows: number;
};

const EMPTY_COMPOSITION_ROWS = 6;

const INNER_COLS = 10;
const VIEWPORT_COLS = 12;
const INTERIOR_COL_START = 1;
const INTERIOR_COL_END = 10;
const COLORS: MondrianColor[] = ['red', 'blue', 'yellow', 'white'];

/** Portrait tiles — equal col/row span on a 2:3 unit grid keeps every tile 2:3. */
export const TILE_SPANS: MondrianSpan[] = [
	{ col: 2, row: 2 },
	{ col: 2, row: 2 },
	{ col: 1, row: 1 }
];

const PLACEMENT_ANCHORS = [
	{ row: 1, col: 1 },
	{ row: 1, col: 6 },
	{ row: 1, col: 9 },
	{ row: 2, col: 4 },
	{ row: 3, col: 1 },
	{ row: 3, col: 6 },
	{ row: 3, col: 9 },
	{ row: 4, col: 3 },
	{ row: 2, col: 8 },
	{ row: 5, col: 5 }
];

function nextColor(index: number): MondrianColor {
	return COLORS[index % COLORS.length];
}

export function spanForMovie(movie: MovieForLayout, index: number): MondrianSpan {
	return TILE_SPANS[(movie.id + index) % TILE_SPANS.length];
}

function spansToTry(preferred: MondrianSpan): MondrianSpan[] {
	const rest = TILE_SPANS.filter((span) => span.col !== preferred.col || span.row !== preferred.row);
	return [preferred, ...rest];
}

function ensureRow(occupied: boolean[][], row: number, cols: number) {
	while (occupied.length <= row) {
		occupied.push(Array.from({ length: cols + 1 }, () => false));
	}
}

function isFree(
	occupied: boolean[][],
	row: number,
	col: number,
	colSpan: number,
	rowSpan: number,
	maxCol: number
): boolean {
	for (let r = row; r < row + rowSpan; r += 1) {
		ensureRow(occupied, r, maxCol);
		for (let c = col; c < col + colSpan; c += 1) {
			if (c < 1 || c > maxCol || occupied[r][c]) return false;
		}
	}
	return true;
}

function mark(
	occupied: boolean[][],
	row: number,
	col: number,
	colSpan: number,
	rowSpan: number,
	maxCol: number
) {
	for (let r = row; r < row + rowSpan; r += 1) {
		ensureRow(occupied, r, maxCol);
		for (let c = col; c < col + colSpan; c += 1) {
			occupied[r][c] = true;
		}
	}
}

function placeBlock(
	placed: PlacedMondrianCell[],
	occupied: boolean[][],
	row: number,
	col: number,
	colSpan: number,
	rowSpan: number,
	colorIndex: number,
	maxCol: number
): number {
	if (!isFree(occupied, row, col, colSpan, rowSpan, maxCol)) return colorIndex;

	mark(occupied, row, col, colSpan, rowSpan, maxCol);
	placed.push({
		kind: 'block',
		color: nextColor(colorIndex),
		span: { col: colSpan, row: rowSpan },
		col,
		row,
		colSpan,
		rowSpan
	});
	return colorIndex + 1;
}

function findAllInteriorFits(
	occupied: boolean[][],
	span: MondrianSpan,
	maxRow = 40
): { row: number; col: number }[] {
	const fits: { row: number; col: number }[] = [];

	for (let row = 1; row < maxRow; row += 1) {
		for (let col = INTERIOR_COL_START; col <= INTERIOR_COL_END - span.col + 1; col += 1) {
			if (isFree(occupied, row, col, span.col, span.row, INNER_COLS)) {
				fits.push({ row, col });
			}
		}
	}

	return fits;
}

function columnMovieUse(placed: PlacedMondrianCell[], col: number): number {
	return placed.filter((cell) => cell.kind === 'movie' && cell.col === col).length;
}

function pickVariedFit(
	fits: { row: number; col: number }[],
	anchor: { row: number; col: number },
	placed: PlacedMondrianCell[],
	seed: number
): { row: number; col: number } {
	const ranked = fits
		.map((fit) => ({
			...fit,
			dist:
				Math.abs(fit.row - anchor.row) +
				Math.abs(fit.col - anchor.col) +
				columnMovieUse(placed, fit.col) * 10
		}))
		.sort((a, b) => a.dist - b.dist || a.row - b.row || a.col - b.col);

	const bestDist = ranked[0].dist;
	const tier = ranked.filter((fit) => fit.dist === bestDist);
	return tier[seed % tier.length];
}

function findMovieFit(
	occupied: boolean[][],
	movie: MovieForLayout,
	index: number,
	placed: PlacedMondrianCell[]
): { row: number; col: number; span: MondrianSpan } | null {
	const anchor = PLACEMENT_ANCHORS[(movie.id + index) % PLACEMENT_ANCHORS.length];
	const seed = movie.id * 3 + index * 5;

	for (const span of spansToTry(spanForMovie(movie, index))) {
		const fits = findAllInteriorFits(occupied, span);
		if (fits.length === 0) continue;

		const pick = pickVariedFit(fits, anchor, placed, seed);
		return { row: pick.row, col: pick.col, span };
	}

	return null;
}

function maxOccupiedRow(occupied: boolean[][]): number {
	for (let row = occupied.length - 1; row >= 1; row -= 1) {
		if (occupied[row]?.some(Boolean)) return row;
	}
	return 1;
}

function tileSpansForCell(_row: number, _col: number): MondrianSpan[] {
	return [{ col: 1, row: 1 }];
}

function fillInteriorGaps(
	placed: PlacedMondrianCell[],
	occupied: boolean[][],
	colorIndex: number,
	lastRow: number
): number {
	for (let row = 1; row <= lastRow; row += 1) {
		for (let col = INTERIOR_COL_START; col <= INTERIOR_COL_END; col += 1) {
			if (occupied[row]?.[col]) continue;

			let placedTile = false;
			for (const span of tileSpansForCell(row, col)) {
				if (col + span.col - 1 > INTERIOR_COL_END) continue;
				if (row + span.row - 1 > lastRow) continue;
				if (isFree(occupied, row, col, span.col, span.row, INNER_COLS)) {
					colorIndex = placeBlock(
						placed,
						occupied,
						row,
						col,
						span.col,
						span.row,
						colorIndex,
						INNER_COLS
					);
					placedTile = true;
					break;
				}
			}

			if (!placedTile && !occupied[row]?.[col]) {
				colorIndex = placeBlock(placed, occupied, row, col, 1, 1, colorIndex, INNER_COLS);
			}
		}
	}

	return colorIndex;
}

function sealGrid(
	placed: PlacedMondrianCell[],
	occupied: boolean[][],
	colorIndex: number,
	maxRow: number
): number {
	for (let row = 1; row <= maxRow; row += 1) {
		for (let col = INTERIOR_COL_START; col <= INTERIOR_COL_END; col += 1) {
			if (occupied[row]?.[col]) continue;
			colorIndex = placeBlock(placed, occupied, row, col, 1, 1, colorIndex, INNER_COLS);
		}
	}
	return colorIndex;
}

function buildInnerComposition(movies: MovieForLayout[]): PlacedMondrianCell[] {
	const placed: PlacedMondrianCell[] = [];
	const occupied: boolean[][] = [[]];
	let colorIndex = 0;

	movies.forEach((movie, index) => {
		const fit = findMovieFit(occupied, movie, index, placed);
		if (!fit) return;

		mark(occupied, fit.row, fit.col, fit.span.col, fit.span.row, INNER_COLS);
		placed.push({
			kind: 'movie',
			id: movie.id,
			span: fit.span,
			col: fit.col,
			row: fit.row,
			colSpan: fit.span.col,
			rowSpan: fit.span.row
		});
	});

	const contentRows = movies.length === 0 ? 0 : maxOccupiedRow(occupied);
	const targetRows =
		movies.length === 0 ? EMPTY_COMPOSITION_ROWS : Math.max(contentRows, 4);
	const canvasRows = movies.length > 0 ? targetRows + 1 : targetRows;

	colorIndex = fillInteriorGaps(placed, occupied, colorIndex, targetRows);

	if (movies.length > 0) {
		colorIndex = fillInteriorGaps(placed, occupied, colorIndex, canvasRows);
	}

	sealGrid(placed, occupied, colorIndex, canvasRows);

	return placed;
}

function compositionRowCount(cells: PlacedMondrianCell[], movies: MovieForLayout[]): number {
	if (movies.length === 0) return EMPTY_COMPOSITION_ROWS;
	return cells.reduce((max, cell) => Math.max(max, cell.row + cell.rowSpan - 1), 4);
}

function fillRowWithVariedBlocks(
	placed: PlacedMondrianCell[],
	occupied: boolean[][],
	row: number,
	colorIndex: number,
	maxCol: number
): number {
	let col = 1;
	while (col <= maxCol) {
		const remaining = maxCol - col + 1;
		const preferWide = col === 1 || col === 4 || col === 7 || col === 10;
		const width =
			preferWide && remaining >= 2 && isFree(occupied, row, col, 2, 1, maxCol) ? 2 : 1;
		colorIndex = placeBlock(placed, occupied, row, col, width, 1, colorIndex, maxCol);
		col += width;
	}
	return colorIndex;
}

function buildSideStrip(
	placed: PlacedMondrianCell[],
	occupied: boolean[][],
	startRow: number,
	endRow: number,
	col: number,
	colorIndex: number,
	maxCol: number,
	tallEvery: number
): number {
	let row = startRow;
	while (row < endRow) {
		const remaining = endRow - row;
		const height =
			remaining >= 2 && row % tallEvery === 0 && isFree(occupied, row, col, 1, 2, maxCol)
				? 2
				: 1;
		colorIndex = placeBlock(placed, occupied, row, col, 1, height, colorIndex, maxCol);
		row += height;
	}
	return colorIndex;
}

function buildOuterFrame(viewportRows: number, colorStart: number): PlacedMondrianCell[] {
	const placed: PlacedMondrianCell[] = [];
	const occupied: boolean[][] = [[]];
	let colorIndex = colorStart;

	colorIndex = fillRowWithVariedBlocks(placed, occupied, 1, colorIndex, VIEWPORT_COLS);
	colorIndex = fillRowWithVariedBlocks(placed, occupied, viewportRows, colorIndex, VIEWPORT_COLS);

	colorIndex = buildSideStrip(
		placed,
		occupied,
		2,
		viewportRows,
		1,
		colorIndex,
		VIEWPORT_COLS,
		2
	);
	colorIndex = buildSideStrip(
		placed,
		occupied,
		2,
		viewportRows,
		VIEWPORT_COLS,
		colorIndex,
		VIEWPORT_COLS,
		3
	);

	return placed;
}

export function buildMondrianLayout(movies: MovieForLayout[]): MondrianViewportLayout {
	const inner = buildInnerComposition(movies);
	const compositionRows = compositionRowCount(inner, movies);
	const viewportRows = compositionRows + 3;
	const outer = buildOuterFrame(viewportRows, 0);

	return {
		outer,
		inner,
		viewportRows,
		panelRowSpan: viewportRows - 1,
		compositionRows
	};
}

/** @deprecated use buildMondrianLayout */
export function buildMondrianComposition(movies: MovieForLayout[]): PlacedMondrianCell[] {
	return buildMondrianLayout(movies).inner;
}

export function mondrianPlacementStyle(cell: PlacedMondrianCell): string {
	return `grid-column: ${cell.col} / span ${cell.colSpan}; grid-row: ${cell.row} / span ${cell.rowSpan}`;
}

export function cycleMondrianColor(color: MondrianColor): MondrianColor {
	const index = COLORS.indexOf(color);
	return COLORS[(index + 1) % COLORS.length];
}

export const MONDRIAN_VIEWPORT_COLS = VIEWPORT_COLS;
export const MONDRIAN_INNER_COLS = INNER_COLS;

/** @deprecated use TILE_SPANS */
export const POSTER_SPAN = TILE_SPANS[2];
