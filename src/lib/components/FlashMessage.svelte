<script lang="ts">
	let {
		message,
		duration = 4000,
		variant = 'success'
	}: {
		message: string;
		duration?: number;
		variant?: 'success' | 'error';
	} = $props();

	let visible = $state(true);
	let fading = $state(false);

	$effect(() => {
		message;
		visible = true;
		fading = false;

		const fadeAt = Math.max(duration - 300, 0);
		const fadeTimer = setTimeout(() => {
			fading = true;
		}, fadeAt);
		const hideTimer = setTimeout(() => {
			visible = false;
		}, duration);

		return () => {
			clearTimeout(fadeTimer);
			clearTimeout(hideTimer);
		};
	});
</script>

{#if visible}
	<p
		class="parrot-flash mb-4"
		class:parrot-flash--success={variant === 'success'}
		class:parrot-flash--error={variant === 'error'}
		class:parrot-flash--fading={fading}
		role="status"
		aria-live="polite"
	>
		{message}
	</p>
{/if}
