<!-- <script lang="ts">
	import { onMount } from 'svelte';
	import Splash from './onboarding/Components/Splash.svelte';
	import Courses from './course-details/Components/Courses.svelte';
	import { goto } from '$app/navigation';
	import { validateSession } from '$lib/utils/helpers/misc.helper';
	import { userDataStore } from '$lib/store/userDataStore';
	import { browser } from '$app/environment';
	let splashScreenVisible = true;
	let user = $userDataStore;

	let deferredPrompt: any;

	let splashScreenVisible = true;

	onMount(() => {
		if (!browser) return;
		const splashDone = sessionStorage.getItem('splashDone');
		// If this is the first load, show the splash screen and then navigate to /community
		if (!splashDone) {
			setTimeout(() => {
				splashScreenVisible = false;
				sessionStorage.setItem('splashDone', 'true');
				goto('/community'); // Redirect to /community after the splash
			}, 3000);
		} else {
			splashScreenVisible = false;
			// Stay on / if explicitly navigated to /
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

<div>
	{#if splashScreenVisible}
		<Splash />
	{:else}
		<Courses />
	{/if}
</div> -->

<script lang="ts">
	import { onMount } from 'svelte';
	import Splash from './onboarding/Components/Splash.svelte';
	import Courses from './course-details/Components/Courses.svelte';
	import { goto } from '$app/navigation';
	import { validateSession } from '$lib/utils/helpers/misc.helper';
	import { getToken } from '$lib/store/authStore';
	import { browser } from '$app/environment';

	let splashScreenVisible = true;
	const SPLASH_SCREEN_TIMEOUT = 3000;
	let deferredPrompt: any;

	onMount(() => {
		if (!browser) return;
		const splashDone = sessionStorage.getItem('splashDone');
		const token = getToken();

		if (!token) {
			goto('/login'); // Redirect to login if unauthenticated
			return;
		}

		if (!splashDone) {
			setTimeout(() => {
				splashScreenVisible = false;
				sessionStorage.setItem('splashDone', 'true');
				goto('/community'); // Redirect after splash
			}, SPLASH_SCREEN_TIMEOUT);
		} else {
			splashScreenVisible = false;
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
		validateSession(); // Validate user session
	});
</script>

<div>
	{#if splashScreenVisible}
		<Splash />
	{:else}
		<Courses />
	{/if}
</div>
