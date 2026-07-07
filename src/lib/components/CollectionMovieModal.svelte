<script lang="ts">
	import { enhance } from '$app/forms';
	import Check from '@lucide/svelte/icons/check';
	import Film from '@lucide/svelte/icons/film';
	import ListPlus from '@lucide/svelte/icons/list-plus';
	import ListVideo from '@lucide/svelte/icons/list-video';
	import X from '@lucide/svelte/icons/x';
	import StarRating from '$lib/components/StarRating.svelte';

	type CollectionMovie = {
		id: number;
		title: string;
		releaseYear: string | null;
		posterPath: string | null;
		tmdbId: number | null;
	};

	type WatchlistEntry = {
		watchlistId: number;
		rating: number | null;
		watched: boolean;
	};

	let {
		movie,
		watchlistEntry = null,
		onClose
	}: {
		movie: CollectionMovie;
		watchlistEntry?: WatchlistEntry | null;
		onClose: () => void;
	} = $props();

	let rating = $state(0);
	let ratingForm = $state<HTMLFormElement | undefined>();
	const onWatchlist = $derived(watchlistEntry !== null);
	const watched = $derived(watchlistEntry?.watched ?? false);

	$effect(() => {
		rating = watchlistEntry?.rating ?? 0;
	});

	function movieLabel(title: string, releaseYear: string | null) {
		return releaseYear ? `${title} (${releaseYear})` : title;
	}

	function saveRating() {
		ratingForm?.requestSubmit();
	}

	function ratingEnhance() {
		return async ({ update }: { update: (opts?: { reset?: boolean }) => Promise<void> }) => {
			await update({ reset: false });
		};
	}

	function handleEnhance() {
		return async ({
			result,
			update
		}: {
			result: { type: string };
			update: () => Promise<void>;
		}) => {
			await update();
			if (result.type === 'success') {
				onClose();
			}
		};
	}

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) onClose();
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') onClose();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div
	class="collection-movie-modal-backdrop"
	role="presentation"
	onclick={handleBackdropClick}
>
	<div
		class="collection-movie-modal"
		role="dialog"
		aria-modal="true"
		aria-labelledby="collection-movie-modal-title"
	>
		<button type="button" class="collection-movie-modal-close parrot-btn parrot-btn-ghost" onclick={onClose}>
			<X size={18} aria-hidden="true" />
			<span class="sr-only">Close</span>
		</button>

		<div class="collection-movie-modal-poster">
			{#if movie.posterPath}
				<img
					src={movie.posterPath}
					alt={movieLabel(movie.title, movie.releaseYear)}
					class="collection-movie-modal-image"
					width="342"
					height="513"
				/>
			{:else}
				<div class="collection-movie-modal-placeholder" aria-hidden="true">
					<Film size={40} />
				</div>
			{/if}
		</div>

		<div class="collection-movie-modal-body">
			<h2 id="collection-movie-modal-title" class="collection-movie-modal-title">
				{movie.title}
			</h2>
			{#if movie.releaseYear}
				<p class="collection-movie-modal-year">{movie.releaseYear}</p>
			{/if}

			{#if onWatchlist}
				<p class="collection-movie-modal-status">
					{watched ? 'Watched' : 'On your watchlist'}
				</p>

				<div class="collection-movie-modal-rating">
					<p class="collection-movie-modal-label">Your rating</p>
					<StarRating bind:value={rating} label={`Rate ${movie.title}`} onchange={saveRating} />
				</div>

				<form
					method="post"
					action="?/updateWatchlistRating"
					use:enhance={ratingEnhance}
					bind:this={ratingForm}
					class="sr-only"
					aria-hidden="true"
				>
					<input type="hidden" name="watchlistId" value={watchlistEntry?.watchlistId} />
					<input type="hidden" name="rating" value={rating || ''} />
				</form>

				<form method="post" action="?/toggleWatched" use:enhance={handleEnhance}>
					<input type="hidden" name="watchlistId" value={watchlistEntry?.watchlistId} />
					<button type="submit" class="parrot-btn w-full {watched ? 'parrot-btn-secondary' : 'parrot-btn-primary'}">
						{#if watched}
							<ListVideo size={16} aria-hidden="true" />
							Move to watchlist
						{:else}
							<Check size={16} aria-hidden="true" />
							Mark as watched
						{/if}
					</button>
				</form>
			{:else}
				<div class="collection-movie-modal-rating">
					<p class="collection-movie-modal-label">Your rating</p>
					<StarRating bind:value={rating} label={`Rate ${movie.title}`} />
				</div>

				<form method="post" action="?/addToWatchlist" use:enhance={handleEnhance}>
					<input type="hidden" name="id" value={movie.id} />
					<input type="hidden" name="rating" value={rating || ''} />
					<button type="submit" class="parrot-btn parrot-btn-primary w-full">
						<ListPlus size={16} aria-hidden="true" />
						Add to watchlist
					</button>
				</form>
			{/if}
		</div>
	</div>
</div>
