<script lang="ts">
	import { tick } from 'svelte';
	import { enhance } from '$app/forms';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import Plus from '@lucide/svelte/icons/plus';
	import Search from '@lucide/svelte/icons/search';
	import Upload from '@lucide/svelte/icons/upload';
	import MovieSearch from '$lib/components/MovieSearch.svelte';

	type FormEnhance = () => (opts: {
		result: { type: string };
		update: () => Promise<void>;
	}) => Promise<void>;

	let {
		addAction,
		addEnhance,
		importEnhance,
		showCsvImport = false,
		importing = false,
		addForm = $bindable<HTMLFormElement | undefined>(),
		movieSearch = $bindable<MovieSearch | undefined>(),
		titleInput = $bindable<HTMLInputElement | undefined>()
	}: {
		addAction: string;
		addEnhance: FormEnhance;
		importEnhance?: FormEnhance;
		showCsvImport?: boolean;
		importing?: boolean;
		addForm?: HTMLFormElement | undefined;
		movieSearch?: MovieSearch | undefined;
		titleInput?: HTMLInputElement | undefined;
	} = $props();

	type PanelMode = 'search' | 'csv' | null;

	let menuOpen = $state(false);
	let panelMode = $state<PanelMode>(null);
	let rootRef = $state<HTMLDivElement | undefined>();
	let csvInputRef = $state<HTMLInputElement | undefined>();

	function closeAll() {
		menuOpen = false;
		panelMode = null;
	}

	function focusPanel(mode: Exclude<PanelMode, null>) {
		void tick().then(() => {
			if (mode === 'search') {
				titleInput?.focus();
			} else {
				csvInputRef?.focus();
			}
		});
	}

	function openPanel(event: MouseEvent, mode: Exclude<PanelMode, null>) {
		event.stopPropagation();
		menuOpen = false;
		panelMode = mode;
		focusPanel(mode);
	}

	function toggleMenu(event: MouseEvent) {
		event.stopPropagation();

		if (panelMode) {
			closeAll();
			return;
		}

		if (showCsvImport) {
			menuOpen = !menuOpen;
			return;
		}

		panelMode = 'search';
		focusPanel('search');
	}

	function handleDocumentClick(event: MouseEvent) {
		const target = event.target as Node | null;
		if (target && rootRef?.contains(target)) return;
		closeAll();
	}

	function handleDocumentKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') closeAll();
	}

	function csvEnhance() {
		if (!importEnhance) {
			return async () => {};
		}

		const submit = importEnhance();
		return async (opts: { result: { type: string }; update: () => Promise<void> }) => {
			await submit(opts);
			if (opts.result.type === 'success') {
				if (csvInputRef) csvInputRef.value = '';
				closeAll();
			}
		};
	}
</script>

<svelte:document onclick={handleDocumentClick} onkeydown={handleDocumentKeydown} />

<div class="movie-add" bind:this={rootRef}>
	<button
		type="button"
		class="parrot-btn parrot-btn-primary movie-add-trigger"
		aria-haspopup={showCsvImport ? 'menu' : undefined}
		aria-expanded={menuOpen || panelMode !== null}
		onclick={toggleMenu}
	>
		<Plus size={16} aria-hidden="true" />
		Add
		<ChevronDown
			size={16}
			aria-hidden="true"
			class={menuOpen || panelMode ? 'movie-add-chevron-open' : ''}
		/>
	</button>

	{#if showCsvImport && menuOpen}
		<div class="movie-add-menu" role="menu">
			<button
				type="button"
				class="movie-add-menu-item"
				role="menuitem"
				onclick={(event) => openPanel(event, 'search')}
			>
				<Search size={16} aria-hidden="true" />
				<span>
					<strong>Search movie</strong>
					<small>Add one title from TMDB</small>
				</span>
			</button>
			<button
				type="button"
				class="movie-add-menu-item"
				role="menuitem"
				onclick={(event) => openPanel(event, 'csv')}
			>
				<Upload size={16} aria-hidden="true" />
				<span>
					<strong>Upload CSV</strong>
					<small>Import up to 50 movies</small>
				</span>
			</button>
		</div>
	{/if}

	{#if panelMode === 'search'}
		<div class="movie-add-panel" role="region" aria-label="Search for a movie">
			<form bind:this={addForm} method="post" action={addAction} use:enhance={addEnhance}>
				<MovieSearch bind:this={movieSearch} bind:inputRef={titleInput} formRef={addForm} />
			</form>
		</div>
	{/if}

	{#if showCsvImport && panelMode === 'csv'}
		<div class="movie-add-panel" role="region" aria-label="Upload CSV">
			<form
				method="post"
				action="?/importCsv"
				enctype="multipart/form-data"
				use:enhance={csvEnhance}
			>
				<div class="movie-add-csv-row">
					<input
						bind:this={csvInputRef}
						class="parrot-input movie-add-file-input"
						type="file"
						name="csv"
						accept=".csv,text/csv"
						required
					/>
					<button
						type="submit"
						class="parrot-btn parrot-btn-secondary movie-add-import-btn"
						disabled={importing}
					>
						<Upload size={16} aria-hidden="true" />
						{importing ? 'Importing…' : 'Import'}
					</button>
				</div>
				<p class="movie-add-hint">
					CSV needs <strong>title</strong> and <strong>year</strong> columns. Replaces your collection.
				</p>
			</form>
		</div>
	{/if}
</div>

<style>
	.movie-add {
		position: relative;
	}

	.movie-add-trigger :global(.movie-add-chevron-open) {
		transform: rotate(180deg);
	}

	.movie-add-trigger :global(svg:last-child) {
		transition: transform 0.15s ease;
	}

	.movie-add-menu {
		position: absolute;
		top: calc(100% + 0.375rem);
		right: 0;
		z-index: 20;
		display: grid;
		min-width: 15rem;
		padding: 0.375rem;
		background: var(--color-mondrian-white);
		border: var(--color-grid-width) solid var(--color-grid);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
	}

	.movie-add-menu-item {
		display: flex;
		align-items: flex-start;
		gap: 0.625rem;
		width: 100%;
		padding: 0.625rem 0.75rem;
		text-align: left;
		background: transparent;
		border: none;
		cursor: pointer;
		color: var(--color-text);
		font-family: var(--font-body);
	}

	.movie-add-menu-item:hover,
	.movie-add-menu-item:focus-visible {
		background: var(--color-surface-ghost-hover);
		outline: none;
	}

	.movie-add-menu-item strong {
		display: block;
		font-size: var(--text-body-size);
		font-weight: 700;
	}

	.movie-add-menu-item small {
		display: block;
		margin-top: 0.125rem;
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}

	.movie-add-panel {
		position: absolute;
		top: calc(100% + 0.375rem);
		right: 0;
		z-index: 20;
		width: min(24rem, calc(100vw - 2rem));
		padding: 0.875rem;
		background: var(--color-mondrian-white);
		border: var(--color-grid-width) solid var(--color-grid);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
	}

	.movie-add-csv-row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.625rem;
		align-items: center;
	}

	.movie-add-file-input {
		flex: 1 1 12rem;
		min-width: 0;
		padding: 0.625rem 0.875rem;
	}

	.movie-add-import-btn {
		flex: 0 0 auto;
	}

	.movie-add-hint {
		margin: 0.625rem 0 0;
		font-size: 0.75rem;
		line-height: 1.4;
		color: var(--color-text-muted);
	}
</style>
