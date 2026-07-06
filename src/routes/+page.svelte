<script lang="ts">
	import { enhance } from '$app/forms';
	import Film from '@lucide/svelte/icons/film';
	import LogOut from '@lucide/svelte/icons/log-out';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import MovieSearch from '$lib/components/MovieSearch.svelte';
	import ParrotAside from '$lib/components/ParrotAside.svelte';
	import type { ActionData, PageServerData } from './$types';

	let { data, form }: { data: PageServerData; form: ActionData } = $props();

	const displayName = $derived(data.user.name || data.user.email.split('@')[0]);
	const possessiveName = $derived(
		displayName.endsWith('s') ? `${displayName}'` : `${displayName}'s`
	);
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

				<form
					bind:this={addForm}
					method="post"
					action="?/addMovie"
					use:enhance={addMovieEnhance}
					class="mb-6"
				>
					<MovieSearch bind:this={movieSearch} bind:inputRef={titleInput} formRef={addForm} />
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
					<ul class="parrot-poster-grid">
						{#each data.movies as movie (movie.id)}
							<li class="parrot-poster-card">
								<div class="parrot-poster-media">
									{#if movie.posterPath}
										<img
											src={movie.posterPath}
											alt=""
											class="parrot-poster-image"
											width="342"
											height="513"
											loading="lazy"
										/>
									{:else}
										<div class="parrot-poster-placeholder" aria-hidden="true">
											<Film size={28} />
										</div>
									{/if}
								</div>
								<div class="parrot-poster-footer">
									<p class="parrot-poster-title">
										{movieLabel(movie.title, movie.releaseYear)}
									</p>
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
						{/each}
					</ul>
				{/if}

				<p class="parrot-tmdb-attribution">
					<img
						src="https://www.themoviedb.org/assets/2/v4/logos/v2/blue_short-8e7b30f73a40269b365ee2031e235a2.svg"
						alt="TMDB"
						width="120"
						height="16"
						class="parrot-tmdb-logo"
					/>
					This product uses the TMDB API but is not endorsed or certified by TMDB.
				</p>
			</div>
		</div>
		<ParrotAside />
	</div>
</div>
