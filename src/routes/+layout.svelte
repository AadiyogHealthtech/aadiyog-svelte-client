<script lang="ts">
	import { onMount, afterUpdate } from 'svelte';
	import '../app.css';
	import { validateSession } from '$lib/utils/helpers/misc.helper';
	import { authStore, getToken } from '$lib/store/authStore';
    import { Toaster } from "svelte-french-toast";
    import { browser } from '$app/environment';
    import { registerServiceWorker } from '$lib/registerSW'; // Import your service worker registration function

	onMount(() => {
		validateSession();
		const token = getToken();
        if (token) {
            // console.log('User is logged in:', token);
        } else {
            // console.log('User is not logged in');
        }

        // Auth store subscription
        const unsubscribe = authStore.subscribe((currentToken) => {
            if (currentToken) {
                // console.log('Auth Updated: User is logged in:', currentToken);
            } else {
                // console.log('Auth Updated: User is logged out');
            }
        });

        // Register service worker
        if (browser) {
            registerServiceWorker();
            
            // Add global styles
            const style = document.createElement('style');
            style.textContent = `
                html, body {
                    background-color: white !important;
                    overflow: auto !important;
                    position: static !important;
                }
            `;
            document.head.appendChild(style);
        }
        
        return unsubscribe;
	});

    // Basic fix after updates
    afterUpdate(() => {
        if (browser) {
            document.documentElement.style.backgroundColor = 'white';
            document.body.style.backgroundColor = 'white';
            document.documentElement.style.overflow = 'auto';
            document.body.style.overflow = 'auto';
        }
    });
</script>

<svelte:head>
    <meta name="theme-color" content="#FFFFFF">
    <style>
        :global(html), :global(body) {
            background-color: white !important;
            overflow: auto !important;
        }
    </style>
</svelte:head>

<Toaster />

<!-- Simpler container -->
<div style="background-color: white; min-height: 100vh; width: 100%;">
    <slot />
</div>