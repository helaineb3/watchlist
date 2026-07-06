<script lang="ts">
	import { enhance } from '$app/forms';
	import Film from '@lucide/svelte/icons/film';
	import LogOut from '@lucide/svelte/icons/log-out';
	import Plus from '@lucide/svelte/icons/plus';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import ParrotAside from '$lib/components/ParrotAside.svelte';
	import type { ActionData, PageServerData } from './$types';

	let { data, form }: { data: PageServerData; form: ActionData } = $props();

	const displayName = $derived(data.user.name || data.user.email.split('@')[0]);
	const possessiveName = $derived(
		displayName.endsWith('s') ? `${displayName}'` : `${displayName}'s`
	);
	let titleInput = $state<HTMLInputElement | undefined>();

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
				titleInput?.form?.reset();
				titleInput?.focus();
			}
		};
	}
</script>

<div class="parrot-page">
	<div class="parrot-shell">
		<div class="parrot-card p-6 sm:p-8">
			<div class="parrot-card-inner">
				<header class="parrot-header">
					<div class="parrot-title-row">
						<h1 class="parrot-title">{possessiveName} watchlist</h1>
					</div>
					<form method="post" action="?/signOut" use:enhance>
						<button type="submit" class="parrot-btn parrot-btn-ghost px-3 py-1.5 text-sm">
							<LogOut size={16} aria-hidden="true" />
							Sign out
						</button>
					</form>
				</header>

				<form method="post" action="?/addMovie" use:enhance={addMovieEnhance} class="mb-6 flex gap-2">
					<input
						bind:this={titleInput}
						type="text"
						name="title"
						placeholder="A movie you want to see…"
						required
						maxlength="200"
						class="parrot-input min-w-0 flex-1"
					/>
					<button type="submit" class="parrot-btn parrot-btn-primary shrink-0">
						<Plus size={16} aria-hidden="true" />
						Add
					</button>
				</form>

				{#if form?.message}
					<p class="parrot-error mb-4">{form.message}</p>
				{/if}

				{#if data.movies.length === 0}
					<p class="parrot-empty">
						<Film size={16} aria-hidden="true" />
						No movies yet — add one above.
					</p>
				{:else}
					<ul class="parrot-list">
						{#each data.movies as movie (movie.id)}
							<li class="parrot-list-item">
								<span class="parrot-list-title">
									<Film class="parrot-list-icon" size={16} aria-hidden="true" />
									{movie.title}
								</span>
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
							</li>
						{/each}
					</ul>
				{/if}
			</div>
		</div>
		<ParrotAside />
	</div>
</div>
