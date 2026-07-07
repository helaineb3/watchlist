<script lang="ts">
	import { enhance } from '$app/forms';
	import Film from '@lucide/svelte/icons/film';
	import Library from '@lucide/svelte/icons/library';
	import LogOut from '@lucide/svelte/icons/log-out';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import MovieSearch from '$lib/components/MovieSearch.svelte';
	import MovieFilter from '$lib/components/MovieFilter.svelte';
	import MondrianBlockButton from '$lib/components/MondrianBlockButton.svelte';
	import { filterMovies } from '$lib/movies/filter';
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
				<h1 class="parrot-title">{possessiveName} watchlist</h1>
			</div>
			<div class="parrot-header-actions">
				<MovieFilter bind:value={filterQuery} />
				<a href="/library" class="parrot-btn parrot-btn-ghost px-3 py-1.5 text-sm">
					<Library size={16} aria-hidden="true" />
					Collection
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
			<form bind:this={addForm} method="post" action="?/addMovie" use:enhance={addMovieEnhance}>
				<MovieSearch bind:this={movieSearch} bind:inputRef={titleInput} formRef={addForm} />
			</form>

			{#if form?.message}
				<p class="parrot-error mt-4">{form.message}</p>
			{/if}
		</div>

		{#if data.movies.length === 0}
			<p class="parrot-empty mb-4">
				<Film size={16} aria-hidden="true" />
				No movies yet — search above to start your composition.
			</p>
		{:else if filteredMovies.length === 0}
			<p class="parrot-empty mb-4">
				<Film size={16} aria-hidden="true" />
				No movies match “{filterQuery.trim()}”.
			</p>
		{/if}

		<ul
			class="mondrian-composition"
			style={`--inner-cols: ${MONDRIAN_INNER_COLS}; --composition-rows: ${layout.compositionRows}`}
			aria-label="Watchlist composition"
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
								<p class="mondrian-poster-title">{movieLabel(movie.title, movie.releaseYear)}</p>
								<form method="post" action="?/deleteMovie" use:enhance>
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
