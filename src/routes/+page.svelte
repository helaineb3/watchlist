<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageServerData } from './$types';

	let { data, form }: { data: PageServerData; form: ActionData } = $props();
</script>

<div class="tropical-page max-w-lg">
	<div class="tropical-card p-6 sm:p-8">
		<div class="tropical-card-inner">
			<div class="mb-8 flex items-center justify-between gap-4">
				<h1 class="tropical-title">Watchlist</h1>
				<form method="post" action="?/signOut" use:enhance>
					<button type="submit" class="tropical-btn tropical-btn-ghost px-3 py-1.5 text-sm"
						>Sign out</button
					>
				</form>
			</div>

			<form method="post" action="?/addMovie" use:enhance class="mb-6 flex gap-2">
				<input
					type="text"
					name="title"
					placeholder="A movie you want to see…"
					required
					maxlength="200"
					class="tropical-input min-w-0 flex-1"
				/>
				<button type="submit" class="tropical-btn tropical-btn-primary shrink-0">Add</button>
			</form>

			{#if form?.message}
				<p class="tropical-error mb-4">{form.message}</p>
			{/if}

			{#if data.movies.length === 0}
				<p class="tropical-empty">No movies yet — add one above.</p>
			{:else}
				<ul class="tropical-list">
					{#each data.movies as movie (movie.id)}
						<li class="tropical-list-item">{movie.title}</li>
					{/each}
				</ul>
			{/if}
		</div>
	</div>
</div>
