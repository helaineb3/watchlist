<script lang="ts">
	import Star from '@lucide/svelte/icons/star';

	let {
		value = $bindable(0),
		max = 5,
		label = 'Rating',
		onchange
	}: {
		value?: number;
		max?: number;
		label?: string;
		onchange?: (value: number) => void;
	} = $props();

	function setRating(next: number) {
		value = next;
		onchange?.(next);
	}
</script>

<div class="star-rating" role="group" aria-label={label}>
	{#each { length: max } as _, index (index)}
		<button
			type="button"
			class="star-rating-star"
			class:star-rating-star--active={index < value}
			aria-label={`Rate ${index + 1} out of ${max}`}
			aria-pressed={index < value}
			onclick={() => {
				setRating(index + 1 === value ? 0 : index + 1);
			}}
		>
			<Star size={22} fill={index < value ? 'currentColor' : 'none'} aria-hidden="true" />
		</button>
	{/each}
</div>

<style>
	.star-rating {
		display: inline-flex;
		align-items: center;
		gap: 0.125rem;
	}

	.star-rating-star {
		display: inline-flex;
		padding: 0.125rem;
		border: none;
		background: transparent;
		color: var(--color-text-muted);
		cursor: pointer;
		transition: color 0.15s ease, transform 0.15s ease;
	}

	.star-rating-star:hover,
	.star-rating-star:focus-visible {
		color: var(--color-mondrian-yellow);
		transform: scale(1.05);
		outline: none;
	}

	.star-rating-star--active {
		color: var(--color-mondrian-yellow);
	}
</style>
