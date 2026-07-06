<script lang="ts">
	import Film from '@lucide/svelte/icons/film';

	type SearchResult = {
		id: number;
		title: string;
		posterUrl: string | null;
		releaseYear: string | null;
	};

	let {
		inputRef = $bindable<HTMLInputElement | undefined>()
	}: {
		inputRef?: HTMLInputElement | undefined;
	} = $props();

	let query = $state('');
	let results = $state<SearchResult[]>([]);
	let open = $state(false);
	let selected = $state<SearchResult | null>(null);
	let loading = $state(false);
	let searchError = $state(false);

	let debounceTimer: ReturnType<typeof setTimeout> | undefined;
	let containerRef = $state<HTMLDivElement | undefined>();

	const showDropdown = $derived(open && query.trim().length >= 2 && !selected);

	async function fetchResults(searchQuery: string) {
		const trimmed = searchQuery.trim();
		if (trimmed.length < 2) {
			results = [];
			return;
		}

		loading = true;
		searchError = false;

		try {
			const response = await fetch(`/api/tmdb/search?q=${encodeURIComponent(trimmed)}`);
			if (!response.ok) throw new Error('Search failed');
			const data = (await response.json()) as { results: SearchResult[] };
			results = data.results;
		} catch {
			results = [];
			searchError = true;
		} finally {
			loading = false;
		}
	}

	function scheduleSearch(value: string) {
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => {
			void fetchResults(value);
		}, 300);
	}

	function handleInput(event: Event) {
		const value = (event.currentTarget as HTMLInputElement).value;
		query = value;
		selected = null;
		open = true;
		scheduleSearch(value);
	}

	function selectResult(result: SearchResult) {
		selected = result;
		query = result.title;
		open = false;
		results = [];
		inputRef?.focus();
	}

	function handleFocus() {
		if (query.trim().length >= 2 && !selected) {
			open = true;
			scheduleSearch(query);
		}
	}

	function handleBlur(event: FocusEvent) {
		const next = event.relatedTarget as Node | null;
		if (next && containerRef?.contains(next)) return;
		open = false;
	}

	export function reset() {
		query = '';
		selected = null;
		results = [];
		open = false;
		searchError = false;
	}
</script>

<div class="movie-search" bind:this={containerRef}>
	<input
		bind:this={inputRef}
		type="text"
		name="title"
		value={query}
		oninput={handleInput}
		onfocus={handleFocus}
		onblur={handleBlur}
		placeholder="Search for a movie…"
		required
		maxlength="200"
		autocomplete="off"
		role="combobox"
		aria-expanded={showDropdown}
		aria-controls="movie-search-results"
		aria-autocomplete="list"
		class="parrot-input w-full"
	/>

	{#if selected}
		<input type="hidden" name="tmdbId" value={selected.id} />
		<input type="hidden" name="posterPath" value={selected.posterUrl ?? ''} />
		<input type="hidden" name="releaseYear" value={selected.releaseYear ?? ''} />
	{/if}

	{#if showDropdown}
		<ul id="movie-search-results" class="movie-search-results" role="listbox">
			{#if loading}
				<li class="movie-search-status">Searching…</li>
			{:else if searchError}
				<li class="movie-search-status">Could not search TMDB. You can still add by title.</li>
			{:else if results.length === 0}
				<li class="movie-search-status">No matches — press Add to save “{query.trim()}” anyway.</li>
			{:else}
				{#each results as result (result.id)}
					<li role="presentation">
						<button
							type="button"
							class="movie-search-option"
							role="option"
							aria-selected={selected?.id === result.id}
							onmousedown={(event) => event.preventDefault()}
							onclick={() => selectResult(result)}
						>
							{#if result.posterUrl}
								<img
									src={result.posterUrl}
									alt=""
									class="movie-search-option-poster"
									width="34"
									height="51"
									loading="lazy"
								/>
							{:else}
								<div class="movie-search-option-poster movie-search-option-poster--empty" aria-hidden="true">
									<Film size={16} />
								</div>
							{/if}
							<span class="movie-search-option-text">
								<span class="movie-search-option-title">{result.title}</span>
								{#if result.releaseYear}
									<span class="movie-search-option-year">{result.releaseYear}</span>
								{/if}
							</span>
						</button>
					</li>
				{/each}
			{/if}
		</ul>
	{/if}
</div>

<style>
	.movie-search {
		position: relative;
		min-width: 0;
		flex: 1;
	}

	.movie-search-results {
		position: absolute;
		top: calc(100% + 0.375rem);
		left: 0;
		right: 0;
		z-index: 20;
		max-height: 16rem;
		overflow-y: auto;
		margin: 0;
		padding: 0.375rem;
		list-style: none;
		background: var(--color-surface-card-hover);
		border: 1.5px solid var(--color-border);
		border-radius: var(--radius-input);
		box-shadow: var(--shadow-card);
	}

	.movie-search-status {
		padding: 0.625rem 0.75rem;
		font-size: var(--text-body-size);
		color: var(--color-text-muted);
	}

	.movie-search-option {
		display: flex;
		width: 100%;
		align-items: center;
		gap: 0.625rem;
		padding: 0.5rem;
		border: none;
		border-radius: calc(var(--radius-input) - 0.25rem);
		background: transparent;
		color: var(--color-text);
		text-align: left;
		cursor: pointer;
		font-family: var(--font-body);
	}

	.movie-search-option:hover,
	.movie-search-option:focus-visible {
		background: var(--color-surface-ghost-hover);
		outline: none;
	}

	.movie-search-option-poster {
		width: 34px;
		height: 51px;
		flex-shrink: 0;
		border-radius: 0.375rem;
		object-fit: cover;
		background: var(--color-surface-chip);
	}

	.movie-search-option-poster--empty {
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--color-text-muted);
	}

	.movie-search-option-text {
		display: flex;
		min-width: 0;
		flex-direction: column;
		gap: 0.125rem;
	}

	.movie-search-option-title {
		font-size: var(--text-body-size);
		font-weight: 600;
		line-height: 1.3;
	}

	.movie-search-option-year {
		font-size: 0.8125rem;
		color: var(--color-text-muted);
	}
</style>
