<script lang="ts">
	import { enhance } from '$app/forms';
	import Check from '@lucide/svelte/icons/check';
	import Film from '@lucide/svelte/icons/film';
	import ListVideo from '@lucide/svelte/icons/list-video';
	import X from '@lucide/svelte/icons/x';
	import StarRating from '$lib/components/StarRating.svelte';

	type WatchlistMovie = {
		id: number;
		title: string;
		releaseYear: string | null;
		posterPath: string | null;
		rating: number | null;
		watched: boolean;
	};

	let {
		movie,
		onClose
	}: {
		movie: WatchlistMovie;
		onClose: () => void;
	} = $props();

	let rating = $state(0);
	let ratingForm = $state<HTMLFormElement | undefined>();

	$effect(() => {
		rating = movie.rating ?? 0;
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

	function toggleEnhance() {
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
		aria-labelledby="watchlist-movie-modal-title"
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
			<h2 id="watchlist-movie-modal-title" class="collection-movie-modal-title">
				{movie.title}
			</h2>
			{#if movie.releaseYear}
				<p class="collection-movie-modal-year">{movie.releaseYear}</p>
			{/if}

			<p class="collection-movie-modal-status">
				{movie.watched ? 'Watched' : 'On your watchlist'}
			</p>

			<div class="collection-movie-modal-rating">
				<p class="collection-movie-modal-label">Your rating</p>
				<StarRating bind:value={rating} label={`Rate ${movie.title}`} onchange={saveRating} />
			</div>

			<form
				method="post"
				action="?/updateRating"
				use:enhance={ratingEnhance}
				bind:this={ratingForm}
				class="sr-only"
				aria-hidden="true"
			>
				<input type="hidden" name="id" value={movie.id} />
				<input type="hidden" name="rating" value={rating || ''} />
			</form>

			<form method="post" action="?/toggleWatched" use:enhance={toggleEnhance}>
				<input type="hidden" name="id" value={movie.id} />
				<button type="submit" class="parrot-btn w-full {movie.watched ? 'parrot-btn-secondary' : 'parrot-btn-primary'}">
					{#if movie.watched}
						<ListVideo size={16} aria-hidden="true" />
						Move to watchlist
					{:else}
						<Check size={16} aria-hidden="true" />
						Mark as watched
					{/if}
				</button>
			</form>
		</div>
	</div>
</div>
