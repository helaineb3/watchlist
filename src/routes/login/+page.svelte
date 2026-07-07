<script lang="ts">
	import { enhance } from '$app/forms';
	import Lock from '@lucide/svelte/icons/lock';
	import LogIn from '@lucide/svelte/icons/log-in';
	import Mail from '@lucide/svelte/icons/mail';
	import User from '@lucide/svelte/icons/user';
	import UserPlus from '@lucide/svelte/icons/user-plus';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();

	let mode = $state<'login' | 'register'>('login');

	$effect(() => {
		if (form?.mode === 'register' || form?.mode === 'login') {
			mode = form.mode;
		}
	});
</script>

<div class="parrot-page">
	<div class="parrot-shell">
		<div class="parrot-card p-6 sm:p-8">
			<div class="parrot-card-inner">
				<div class="login-mondrian-accent" aria-hidden="true">
					<span class="login-mondrian-block login-mondrian-block--red"></span>
					<span class="login-mondrian-block login-mondrian-block--blue"></span>
					<span class="login-mondrian-block login-mondrian-block--yellow"></span>
				</div>

				<div class="parrot-title-row mb-2">
					<h1 class="parrot-title">watchlist</h1>
				</div>
				<p class="parrot-subtitle mb-8">
					{mode === 'login'
						? 'Sign in to your watchlist.'
						: 'Create an account to start your list.'}
				</p>

				<form
					method="post"
					action={mode === 'login' ? '?/signInEmail' : '?/signUpEmail'}
					use:enhance
					class="flex flex-col gap-4"
				>
					<label class="parrot-label">
						<span class="parrot-label-row">
							<Mail size={14} aria-hidden="true" />
							Email
						</span>
						<input type="email" name="email" required class="parrot-input" autocomplete="email" />
					</label>
					<label class="parrot-label">
						<span class="parrot-label-row">
							<Lock size={14} aria-hidden="true" />
							Password
						</span>
						<input
							type="password"
							name="password"
							required
							class="parrot-input"
							autocomplete={mode === 'login' ? 'current-password' : 'new-password'}
						/>
					</label>
					{#if mode === 'register'}
						<label class="parrot-label">
							<span class="parrot-label-row">
								<User size={14} aria-hidden="true" />
								Name
							</span>
							<input name="name" required class="parrot-input" autocomplete="name" />
						</label>
					{/if}
					<button type="submit" class="parrot-btn parrot-btn-primary mt-2 w-full">
						{#if mode === 'login'}
							<LogIn size={16} aria-hidden="true" />
							Login
						{:else}
							<UserPlus size={16} aria-hidden="true" />
							Register
						{/if}
					</button>
				</form>

				<p class="login-mode-switch">
					{#if mode === 'login'}
						Need an account?
						<button type="button" class="login-mode-switch-link" onclick={() => (mode = 'register')}>
							Register
						</button>
					{:else}
						Already have an account?
						<button type="button" class="login-mode-switch-link" onclick={() => (mode = 'login')}>
							Sign in
						</button>
					{/if}
				</p>

				{#if form?.message}
					<p class="parrot-error mt-4">{form.message}</p>
				{/if}
			</div>
		</div>
	</div>
</div>

<style>
	.login-mondrian-accent {
		display: grid;
		grid-template-columns: 2fr 1fr 1fr;
		gap: var(--color-grid-width);
		height: 4.5rem;
		margin-bottom: 1.5rem;
		padding: var(--color-grid-width);
		background: var(--color-grid);
		border: var(--color-grid-width) solid var(--color-grid);
	}

	.login-mondrian-block {
		display: block;
		min-height: 100%;
	}

	.login-mondrian-block--red {
		background: var(--color-mondrian-red);
	}

	.login-mondrian-block--blue {
		background: var(--color-mondrian-blue);
	}

	.login-mondrian-block--yellow {
		background: var(--color-mondrian-yellow);
	}

	.login-mode-switch {
		margin: 0.875rem 0 0;
		font-size: 0.8125rem;
		color: var(--color-text-muted);
		text-align: center;
	}

	.login-mode-switch-link {
		padding: 0;
		border: none;
		background: none;
		color: var(--color-mondrian-blue);
		font: inherit;
		font-size: inherit;
		font-weight: 700;
		cursor: pointer;
		text-decoration: underline;
		text-underline-offset: 0.125rem;
	}

	.login-mode-switch-link:hover,
	.login-mode-switch-link:focus-visible {
		color: var(--color-text);
		outline: none;
	}
</style>
