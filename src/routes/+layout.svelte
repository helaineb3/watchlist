<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { MONDRIAN_FONT_URL } from '$lib/design/config';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link rel="stylesheet" href={MONDRIAN_FONT_URL} />
</svelte:head>

{@render children()}
