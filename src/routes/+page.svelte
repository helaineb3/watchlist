<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageServerData } from './$types';

	let { data, form }: { data: PageServerData; form: ActionData } = $props();
</script>

<div class="mx-auto max-w-lg px-4 py-12">
	<div class="mb-8 flex items-center justify-between">
		<h1 class="text-2xl font-semibold">Watchlist</h1>
		<form method="post" action="?/signOut" use:enhance>
			<button type="submit" class="text-sm text-gray-600 underline">Sign out</button>
		</form>
	</div>

	<form method="post" action="?/addMovie" use:enhance class="mb-8 flex gap-2">
		<input
			type="text"
			name="title"
			placeholder="Movie title"
			required
			maxlength="200"
			class="min-w-0 flex-1 rounded border border-gray-300 px-3 py-2"
		/>
		<button type="submit" class="rounded bg-gray-900 px-4 py-2 text-sm text-white">Add</button>
	</form>

	{#if form?.message}
		<p class="mb-4 text-sm text-red-600">{form.message}</p>
	{/if}

	{#if data.movies.length === 0}
		<p class="text-sm text-gray-500">No movies yet.</p>
	{:else}
		<ul class="divide-y divide-gray-200 border-t border-gray-200">
			{#each data.movies as movie (movie.id)}
				<li class="py-3 text-sm">{movie.title}</li>
			{/each}
		</ul>
	{/if}
</div>
