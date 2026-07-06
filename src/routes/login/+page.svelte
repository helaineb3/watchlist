<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<div class="tropical-page max-w-sm">
	<div class="tropical-card p-6 sm:p-8">
		<div class="tropical-card-inner">
			<h1 class="tropical-title mb-2">Watchlist</h1>
			<p class="tropical-subtitle mb-8">Sign in or create an account to start your list.</p>

			<form method="post" action="?/signInEmail" use:enhance class="flex flex-col gap-4">
				<label class="tropical-label">
					Email
					<input type="email" name="email" required class="tropical-input" />
				</label>
				<label class="tropical-label">
					Password
					<input type="password" name="password" required class="tropical-input" />
				</label>
				<label class="tropical-label">
					Name (for registration)
					<input name="name" class="tropical-input" />
				</label>
				<div class="mt-2 flex gap-2">
					<button type="submit" class="tropical-btn tropical-btn-primary flex-1">Login</button>
					<button
						type="submit"
						formaction="?/signUpEmail"
						class="tropical-btn tropical-btn-secondary flex-1">Register</button
					>
				</div>
			</form>

			{#if form?.message}
				<p class="tropical-error mt-4">{form.message}</p>
			{/if}
		</div>
	</div>
</div>
