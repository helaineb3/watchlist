<script lang="ts">
	import { enhance } from '$app/forms';
	import Lock from '@lucide/svelte/icons/lock';
	import LogIn from '@lucide/svelte/icons/log-in';
	import Mail from '@lucide/svelte/icons/mail';
	import User from '@lucide/svelte/icons/user';
	import UserPlus from '@lucide/svelte/icons/user-plus';
	import ParrotAside from '$lib/components/ParrotAside.svelte';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<div class="parrot-page">
	<div class="parrot-shell">
		<div class="parrot-card p-6 sm:p-8">
			<div class="parrot-card-inner">
				<div class="parrot-feather-strip" aria-hidden="true">
					<img src="/parrots/macaws.jpg" alt="" width="40" height="40" />
					<img src="/parrots/amazon.jpg" alt="" width="40" height="40" />
					<img src="/parrots/blue-gold.jpg" alt="" width="40" height="40" />
					<img src="/parrots/scarlet-art.jpg" alt="" width="40" height="40" />
				</div>

				<div class="parrot-title-row mb-2">
					<h1 class="parrot-title">watchlist</h1>
				</div>
				<p class="parrot-subtitle mb-8">Sign in or create an account to start your list.</p>

				<form method="post" action="?/signInEmail" use:enhance class="flex flex-col gap-4">
					<label class="parrot-label">
						<span class="parrot-label-row">
							<Mail size={14} aria-hidden="true" />
							Email
						</span>
						<input type="email" name="email" required class="parrot-input" />
					</label>
					<label class="parrot-label">
						<span class="parrot-label-row">
							<Lock size={14} aria-hidden="true" />
							Password
						</span>
						<input type="password" name="password" required class="parrot-input" />
					</label>
					<label class="parrot-label">
						<span class="parrot-label-row">
							<User size={14} aria-hidden="true" />
							Name (for registration)
						</span>
						<input name="name" class="parrot-input" />
					</label>
					<div class="mt-2 flex gap-2">
						<button type="submit" class="parrot-btn parrot-btn-primary flex-1">
							<LogIn size={16} aria-hidden="true" />
							Login
						</button>
						<button
							type="submit"
							formaction="?/signUpEmail"
							class="parrot-btn parrot-btn-secondary flex-1"
						>
							<UserPlus size={16} aria-hidden="true" />
							Register
						</button>
					</div>
				</form>

				{#if form?.message}
					<p class="parrot-error mt-4">{form.message}</p>
				{/if}
			</div>
		</div>
		<ParrotAside />
	</div>
</div>
