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
						<li class="tropical-list-item">
							<span class="tropical-list-title">{movie.title}</span>
							<form method="post" action="?/deleteMovie" use:enhance>
								<input type="hidden" name="id" value={movie.id} />
								<button
									type="submit"
									class="tropical-btn tropical-btn-delete"
									aria-label="Remove {movie.title}"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="1.75"
										stroke-linecap="round"
										stroke-linejoin="round"
										aria-hidden="true"
									>
										<path d="M4 7h16" />
										<path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
										<path d="M10 11v6" />
										<path d="M14 11v6" />
										<path d="M6 7l1 12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-12" />
									</svg>
								</button>
							</form>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	</div>
</div>
