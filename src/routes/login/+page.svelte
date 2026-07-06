<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<div class="mx-auto max-w-sm px-4 py-12">
	<h1 class="mb-6 text-2xl font-semibold">Watchlist</h1>
	<form method="post" action="?/signInEmail" use:enhance class="flex flex-col gap-4">
		<label class="flex flex-col gap-1 text-sm">
			Email
			<input
				type="email"
				name="email"
				required
				class="rounded border border-gray-300 px-3 py-2"
			/>
		</label>
		<label class="flex flex-col gap-1 text-sm">
			Password
			<input
				type="password"
				name="password"
				required
				class="rounded border border-gray-300 px-3 py-2"
			/>
		</label>
		<label class="flex flex-col gap-1 text-sm">
			Name (for registration)
			<input name="name" class="rounded border border-gray-300 px-3 py-2" />
		</label>
		<div class="flex gap-2">
			<button type="submit" class="rounded bg-gray-900 px-4 py-2 text-sm text-white">Login</button>
			<button
				type="submit"
				formaction="?/signUpEmail"
				class="rounded border border-gray-300 px-4 py-2 text-sm">Register</button
			>
		</div>
	</form>
	{#if form?.message}
		<p class="mt-4 text-sm text-red-600">{form.message}</p>
	{/if}
</div>
