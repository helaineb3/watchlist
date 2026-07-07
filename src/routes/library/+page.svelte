<script lang="ts">
	import { enhance } from '$app/forms';
	import Film from '@lucide/svelte/icons/film';
	import Library from '@lucide/svelte/icons/library';
	import LogOut from '@lucide/svelte/icons/log-out';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import CollectionMovieModal from '$lib/components/CollectionMovieModal.svelte';
	import FlashMessage from '$lib/components/FlashMessage.svelte';
	import MovieAddMenu from '$lib/components/MovieAddMenu.svelte';
	import MovieFilter from '$lib/components/MovieFilter.svelte';
	import MovieSearch from '$lib/components/MovieSearch.svelte';
	import MondrianBlockButton from '$lib/components/MondrianBlockButton.svelte';
	import { filterMovies } from '$lib/movies/filter';
	import { watchlistEntryForMovie } from '$lib/movies/watchlist';
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
	let filterQuery = $state('');
	let selectedMovieId = $state<number | null>(null);
	const selectedMovie = $derived(
		selectedMovieId === null ? null : (moviesById.get(selectedMovieId) ?? null)
	);
	const selectedWatchlistEntry = $derived(
		selectedMovie ? watchlistEntryForMovie(selectedMovie, data.watchlistEntries) : null
	);
	const filteredMovies = $derived(filterMovies(data.movies, filterQuery));
	const layout = $derived(
		buildMondrianLayout(
			filteredMovies.map((movie) => ({
				id: movie.id,
				title: movie.title,
				releaseYear: movie.releaseYear
			}))
		)
	);

	let blockColors = $state<Record<string, MondrianColor>>({});
	let importing = $state(false);
	let titleInput = $state<HTMLInputElement | undefined>();
	let movieSearch = $state<MovieSearch | undefined>();
	let addForm = $state<HTMLFormElement | undefined>();

	function addMovieEnhance() {
		return async ({
			result,
			update
		}: {
			result: { type: string };
			update: () => Promise<void>;
		}) => {
			await update();
			if (result.type === 'success') {
				movieSearch?.reset();
				titleInput?.focus();
			}
		};
	}

	function movieLabel(title: string, releaseYear: string | null) {
		return releaseYear ? `${title} (${releaseYear})` : title;
	}

	function openMovieModal(movieId: number) {
		selectedMovieId = movieId;
	}

	function closeMovieModal() {
		selectedMovieId = null;
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
				<MovieFilter bind:value={filterQuery} />
				<MovieAddMenu
					addAction="?/addOwnedMovie"
					addEnhance={addMovieEnhance}
					importEnhance={importEnhance}
					showCsvImport
					{importing}
					bind:addForm
					bind:movieSearch
					bind:titleInput
				/>
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

		{#if form?.message}
			<p class="parrot-error mb-4">{form.message}</p>
		{/if}

		{#if form?.importSummary}
			<FlashMessage
				message={`Imported ${form.importSummary.total} movies — ${form.importSummary.matched} matched with posters, ${form.importSummary.unmatched} without a TMDB match.`}
			/>
		{/if}

		{#if form?.watchlistMessage}
			<FlashMessage message={form.watchlistMessage} />
		{/if}

		{#if data.movies.length === 0}
			<p class="parrot-empty mb-4">
				<Library size={16} aria-hidden="true" />
				No movies yet — use Add to search or upload a CSV.
			</p>
		{:else if filteredMovies.length === 0}
			<p class="parrot-empty mb-4">
				<Library size={16} aria-hidden="true" />
				No movies match “{filterQuery.trim()}”.
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
							<button
								type="button"
								class="mondrian-poster-open"
								aria-label="Open {movieLabel(movie.title, movie.releaseYear)}"
								onclick={() => openMovieModal(movie.id)}
							>
								<div class="mondrian-poster-media">
									{#if movie.posterPath}
										<img
											src={movie.posterPath}
											alt=""
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
							</button>
							<div class="mondrian-poster-overlay">
								<p class="mondrian-poster-title">{movieLabel(movie.title, movie.releaseYear)}</p>
								<form
									class="mondrian-poster-action mondrian-poster-action--delete"
									method="post"
									action="?/deleteOwnedMovie"
									use:enhance
								>
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

{#if selectedMovie}
	<CollectionMovieModal
		movie={selectedMovie}
		watchlistEntry={selectedWatchlistEntry}
		onClose={closeMovieModal}
	/>
{/if}
