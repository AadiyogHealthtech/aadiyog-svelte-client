<script lang="ts">
	import { onMount } from 'svelte';
	import Splash from './onboarding/Components/Splash.svelte';
	import Courses from './course-details/Components/Courses.svelte';
	import Onboarding from './onboarding/Components/Onboarding.svelte';
	import { validateSession } from '$lib/utils/helpers/misc.helper';
	import { userDataStore } from '$lib/store/userDataStore';
	import { browser } from '$app/environment';
	let splashScreenVisible = true;
	let user = $userDataStore;

	let deferredPrompt: any;

	onMount(() => {
		if (!browser) return;
		const splashDone = sessionStorage.getItem('splashDone');
		if (splashDone) {
			splashScreenVisible = false;
		} else {
			setTimeout(() => {
				splashScreenVisible = false;
				sessionStorage.setItem('splashDone', 'true');
			}, 3000);
		}

		// Listen for the beforeinstallprompt event
		window.addEventListener('beforeinstallprompt', (e) => {
			e.preventDefault();
			deferredPrompt = e;

			// Check URL parameters for install intent
			const url = new URL(window.location.href);
			const shouldInstall = url.searchParams.get('install') === 'true';

			if (shouldInstall && deferredPrompt) {
				// Clean the URL
				url.searchParams.delete('install');
				window.history.replaceState({}, '', url.toString());

				// Show the install prompt after a small delay
				setTimeout(() => {
					deferredPrompt.prompt();
					deferredPrompt.userChoice.then((choiceResult: { outcome: string }) => {
						if (choiceResult.outcome === 'accepted') {
							console.log('PWA installation accepted');
						}
						deferredPrompt = null;
					});
				}, 1000);
			}
		});

		// Optional: Handle cases where the PWA is already installed
		window.addEventListener('appinstalled', () => {
			console.log('PWA was installed');
			deferredPrompt = null;
		});
		validateSession();
	});
</script>

<div class="">
	{#if splashScreenVisible}
		<Splash />
	{:else}
		<Courses />
	{/if}
</div>
