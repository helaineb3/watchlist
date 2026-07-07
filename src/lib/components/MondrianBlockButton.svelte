<script lang="ts">
	import type { MondrianColor } from '$lib/design/mondrian';

	let {
		color,
		class: className = '',
		style = '',
		onCycle
	}: {
		color: MondrianColor;
		class?: string;
		style?: string;
		onCycle: () => void;
	} = $props();
</script>

<button
	type="button"
	class={`mondrian-color-btn ${className}`}
	{style}
	aria-label="{color} block — click to change color"
	onclick={onCycle}
></button>

<style>
	.mondrian-color-btn {
		display: block;
		width: 100%;
		height: 100%;
		min-height: 100%;
		padding: 0;
		border: none;
		cursor: pointer;
		background: transparent;
	}

	.mondrian-color-btn:focus-visible {
		outline: 3px solid var(--color-mondrian-black);
		outline-offset: -3px;
	}

	:global(.mondrian-color-btn-host) {
		width: 100%;
		height: 100%;
	}
</style>
