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
		addEnhance,
		importEnhance,
		importing = false,
		addForm = $bindable<HTMLFormElement | undefined>(),
		movieSearch = $bindable<MovieSearch | undefined>(),
		titleInput = $bindable<HTMLInputElement | undefined>()
	}: {
		addEnhance: FormEnhance;
		importEnhance: FormEnhance;
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

	function openPanel(event: MouseEvent, mode: Exclude<PanelMode, null>) {
		event.stopPropagation();
		menuOpen = false;
		panelMode = mode;
		void tick().then(() => {
			if (mode === 'search') {
				titleInput?.focus();
			} else {
				csvInputRef?.focus();
			}
		});
	}

	function toggleMenu(event: MouseEvent) {
		event.stopPropagation();
		if (panelMode) {
			closeAll();
			return;
		}
		menuOpen = !menuOpen;
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

<div class="collection-add" bind:this={rootRef}>
	<button
		type="button"
		class="parrot-btn parrot-btn-primary collection-add-trigger"
		aria-haspopup="menu"
		aria-expanded={menuOpen || panelMode !== null}
		onclick={toggleMenu}
	>
		<Plus size={16} aria-hidden="true" />
		Add
		<ChevronDown
			size={16}
			aria-hidden="true"
			class={menuOpen || panelMode ? 'collection-add-chevron-open' : ''}
		/>
	</button>

	{#if menuOpen}
		<div class="collection-add-menu" role="menu">
			<button
				type="button"
				class="collection-add-menu-item"
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
				class="collection-add-menu-item"
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
		<div class="collection-add-panel" role="region" aria-label="Search for a movie">
			<form bind:this={addForm} method="post" action="?/addOwnedMovie" use:enhance={addEnhance}>
				<MovieSearch bind:this={movieSearch} bind:inputRef={titleInput} formRef={addForm} />
			</form>
		</div>
	{/if}

	{#if panelMode === 'csv'}
		<div class="collection-add-panel" role="region" aria-label="Upload CSV">
			<form
				method="post"
				action="?/importCsv"
				enctype="multipart/form-data"
				use:enhance={csvEnhance}
			>
				<div class="collection-add-csv-row">
					<input
						bind:this={csvInputRef}
						class="parrot-input collection-add-file-input"
						type="file"
						name="csv"
						accept=".csv,text/csv"
						required
					/>
					<button
						type="submit"
						class="parrot-btn parrot-btn-secondary collection-add-import-btn"
						disabled={importing}
					>
						<Upload size={16} aria-hidden="true" />
						{importing ? 'Importing…' : 'Import'}
					</button>
				</div>
				<p class="collection-add-hint">
					CSV needs <strong>title</strong> and <strong>year</strong> columns. Replaces your collection.
				</p>
			</form>
		</div>
	{/if}
</div>

<style>
	.collection-add {
		position: relative;
	}

	.collection-add-trigger :global(.collection-add-chevron-open) {
		transform: rotate(180deg);
	}

	.collection-add-trigger :global(svg:last-child) {
		transition: transform 0.15s ease;
	}

	.collection-add-menu {
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

	.collection-add-menu-item {
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

	.collection-add-menu-item:hover,
	.collection-add-menu-item:focus-visible {
		background: var(--color-surface-ghost-hover);
		outline: none;
	}

	.collection-add-menu-item strong {
		display: block;
		font-size: var(--text-body-size);
		font-weight: 700;
	}

	.collection-add-menu-item small {
		display: block;
		margin-top: 0.125rem;
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}

	.collection-add-panel {
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

	.collection-add-csv-row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.625rem;
		align-items: center;
	}

	.collection-add-file-input {
		flex: 1 1 12rem;
		min-width: 0;
		padding: 0.625rem 0.875rem;
	}

	.collection-add-import-btn {
		flex: 0 0 auto;
	}

	.collection-add-hint {
		margin: 0.625rem 0 0;
		font-size: 0.75rem;
		line-height: 1.4;
		color: var(--color-text-muted);
	}
</style>
