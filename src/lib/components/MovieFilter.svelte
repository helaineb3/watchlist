<script lang="ts">
	import Search from '@lucide/svelte/icons/search';

	let {
		value = $bindable(''),
		placeholder = 'Search your movies…'
	}: {
		value?: string;
		placeholder?: string;
	} = $props();
</script>

<label class="movie-filter">
	<Search size={16} class="movie-filter-icon" aria-hidden="true" />
	<input
		type="search"
		class="parrot-input movie-filter-input"
		bind:value
		{placeholder}
		aria-label={placeholder}
		autocomplete="off"
	/>
</label>

<style>
	.movie-filter {
		position: relative;
		display: flex;
		align-items: center;
		flex: 1 1 12rem;
		min-width: 0;
		max-width: 18rem;
		color: var(--color-text-muted);
	}

	.movie-filter :global(.movie-filter-icon) {
		position: absolute;
		left: 0.75rem;
		pointer-events: none;
	}

	.movie-filter-input {
		width: 100%;
		padding: 0.5rem 0.75rem 0.5rem 2.25rem;
	}
</style>
