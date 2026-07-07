<script lang="ts">
	import { enhance } from '$app/forms';
	import Film from '@lucide/svelte/icons/film';
	import Library from '@lucide/svelte/icons/library';
	import LogOut from '@lucide/svelte/icons/log-out';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import Upload from '@lucide/svelte/icons/upload';
	import MondrianBlockButton from '$lib/components/MondrianBlockButton.svelte';
	import {
		buildMondrianLayout,
		cycleMondrianColor,
		MONDRIAN_INNER_COLS,
		MONDRIAN_VIEWPORT_COLS,
		mondrianPlacementStyle,
		type MondrianColor,
		type PlacedMondrianCell
	} from '$lib/design/mondrian';
	import type { ActionData, PageServerData } from './$types';

	let { data, form }: { data: PageServerData; form: ActionData } = $props();

	const displayName = $derived(data.user.name || data.user.email.split('@')[0]);
	const possessiveName = $derived(
		displayName.endsWith('s') ? `${displayName}'` : `${displayName}'s`
	);

	const moviesById = $derived(new Map(data.movies.map((movie) => [movie.id, movie])));
	const layout = $derived(
		buildMondrianLayout(
			data.movies.map((movie) => ({
				id: movie.id,
				title: movie.title,
				releaseYear: movie.releaseYear
			}))
		)
	);

	let blockColors = $state<Record<string, MondrianColor>>({});
	let importing = $state(false);

	function movieLabel(title: string, releaseYear: string | null) {
		return releaseYear ? `${title} (${releaseYear})` : title;
	}

	function blockKey(prefix: string, cell: PlacedMondrianCell, index: number) {
		return `${prefix}-${cell.row}-${cell.col}-${index}`;
	}

	function blockColor(prefix: string, cell: PlacedMondrianCell, index: number): MondrianColor {
		if (cell.kind !== 'block') return 'white';
		const key = blockKey(prefix, cell, index);
		return blockColors[key] ?? cell.color;
	}

	function cycleBlockColor(prefix: string, cell: PlacedMondrianCell, index: number) {
		if (cell.kind !== 'block') return;
		const key = blockKey(prefix, cell, index);
		blockColors[key] = cycleMondrianColor(blockColor(prefix, cell, index));
	}

	function innerBlockClass(cell: PlacedMondrianCell, index: number) {
		return `mondrian-cell mondrian-cell--interactive mondrian-cell--${blockColor('inner', cell, index)}`;
	}

	function outerBlockClass(cell: PlacedMondrianCell, index: number) {
		return `mondrian-cell mondrian-cell--interactive mondrian-cell--${blockColor('outer', cell, index)}`;
	}

	function importEnhance() {
		importing = true;
		return async ({
			result,
			update
		}: {
			result: { type: string };
			update: () => Promise<void>;
		}) => {
			await update();
			importing = false;
			if (result.type === 'success') {
				const fileInput = document.querySelector<HTMLInputElement>('#library-csv-input');
				if (fileInput) fileInput.value = '';
			}
		};
	}
</script>

<div
	class="mondrian-viewport"
	style={`--viewport-rows: ${layout.viewportRows}; --viewport-cols: ${MONDRIAN_VIEWPORT_COLS}`}
>
	{#each layout.outer as cell, index (blockKey('outer', cell, index))}
		<MondrianBlockButton
			class={outerBlockClass(cell, index)}
			style={mondrianPlacementStyle(cell)}
			color={blockColor('outer', cell, index)}
			onCycle={() => cycleBlockColor('outer', cell, index)}
		/>
	{/each}

	<article
		class="mondrian-panel"
		style={`grid-row: 2 / span ${layout.panelRowSpan - 1}; grid-column: 2 / span 10`}
	>
		<header class="parrot-header">
			<div class="parrot-title-row">
				<h1 class="parrot-title">{possessiveName} collection</h1>
			</div>
			<div class="parrot-header-actions">
				<a href="/" class="parrot-btn parrot-btn-ghost px-3 py-1.5 text-sm">
					<Film size={16} aria-hidden="true" />
					Watchlist
				</a>
				<form method="post" action="?/signOut" use:enhance>
					<button type="submit" class="parrot-btn parrot-btn-ghost px-3 py-1.5 text-sm">
						<LogOut size={16} aria-hidden="true" />
						Sign out
					</button>
				</form>
			</div>
		</header>

		<div class="mondrian-search-panel">
			<form method="post" action="?/importCsv" enctype="multipart/form-data" use:enhance={importEnhance}>
				<div class="library-import-row">
					<label class="library-file-label parrot-label">
						<span class="parrot-label-row">
							<Library size={16} aria-hidden="true" />
							Upload CSV
						</span>
						<input
							id="library-csv-input"
							class="parrot-input library-file-input"
							type="file"
							name="csv"
							accept=".csv,text/csv"
							required
						/>
					</label>
					<button
						type="submit"
						class="parrot-btn parrot-btn-primary library-import-btn"
						disabled={importing}
					>
						<Upload size={16} aria-hidden="true" />
						{importing ? 'Importing…' : 'Import'}
					</button>
				</div>
			</form>

			<p class="parrot-subtitle mt-3">
				CSV with <strong>title</strong> and <strong>year</strong> columns. Replaces your current
				collection. Up to 50 movies per import.
			</p>

			{#if form?.message}
				<p class="parrot-error mt-4">{form.message}</p>
			{/if}

			{#if form?.importSummary}
				<p class="parrot-import-summary mt-4">
					Imported {form.importSummary.total} movies —
					{form.importSummary.matched} matched with posters,
					{form.importSummary.unmatched} without a TMDB match.
				</p>
			{/if}
		</div>

		{#if data.movies.length === 0}
			<p class="parrot-empty mb-4">
				<Library size={16} aria-hidden="true" />
				No movies yet — upload a CSV to build your collection grid.
			</p>
		{/if}

		<ul
			class="mondrian-composition"
			style={`--inner-cols: ${MONDRIAN_INNER_COLS}; --composition-rows: ${layout.compositionRows}`}
			aria-label="Collection composition"
		>
			{#each layout.inner as cell, index (cell.kind === 'movie' ? `movie-${cell.id}` : blockKey('inner', cell, index))}
				{#if cell.kind === 'block'}
					<li class={innerBlockClass(cell, index)} style={mondrianPlacementStyle(cell)}>
						<MondrianBlockButton
							class="mondrian-color-btn-host"
							color={blockColor('inner', cell, index)}
							onCycle={() => cycleBlockColor('inner', cell, index)}
						/>
					</li>
				{:else}
					{@const movie = moviesById.get(cell.id)}
					{#if movie}
						<li class="mondrian-cell mondrian-poster" style={mondrianPlacementStyle(cell)}>
							<div class="mondrian-poster-media">
								{#if movie.posterPath}
									<img
										src={movie.posterPath}
										alt={movieLabel(movie.title, movie.releaseYear)}
										class="mondrian-poster-image"
										width="342"
										height="513"
										loading="lazy"
									/>
								{:else}
									<div class="mondrian-poster-placeholder" aria-hidden="true">
										<Film size={28} />
									</div>
								{/if}
							</div>
							<div class="mondrian-poster-overlay">
								<form method="post" action="?/deleteOwnedMovie" use:enhance>
									<input type="hidden" name="id" value={movie.id} />
									<button
										type="submit"
										class="parrot-btn parrot-btn-delete"
										aria-label="Remove {movie.title}"
									>
										<Trash2 size={16} aria-hidden="true" />
									</button>
								</form>
							</div>
						</li>
					{/if}
				{/if}
			{/each}
		</ul>

		<p class="parrot-tmdb-attribution">
			<img
				src="/tmdb-logo.png"
				alt="TMDB"
				width="120"
				height="16"
				class="parrot-tmdb-logo"
			/>
			This product uses the TMDB API but is not endorsed or certified by TMDB.
		</p>
	</article>
</div>

<style>
	.library-import-row {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		gap: 0.75rem;
	}

	.library-file-label {
		flex: 1 1 14rem;
		min-width: 0;
	}

	.library-file-input {
		width: 100%;
		padding: 0.625rem 0.875rem;
	}

	.library-import-btn {
		flex: 0 0 auto;
	}

	.parrot-import-summary {
		font-size: var(--text-body-size);
		font-weight: 600;
		color: var(--color-text);
	}
</style>
