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
	<Search size={16} aria-hidden="true" />
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
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex: 1 1 12rem;
		min-width: 0;
		max-width: 18rem;
		color: var(--color-text-muted);
	}

	.movie-filter-input {
		width: 100%;
		padding: 0.5rem 0.75rem;
	}
</style>
