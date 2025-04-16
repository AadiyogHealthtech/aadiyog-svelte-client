<script lang="ts">
	import { onMount } from 'svelte';
	import '../app.css';
	import { validateSession } from '$lib/utils/helpers/misc.helper';
	import { goto } from '$app/navigation';
    import { authStore , getToken } from '$lib/store/authStore';
    import {Toaster} from "svelte-french-toast"
	onMount(() => {
		validateSession();
		const token = getToken(); // Get the current token synchronously
        if (token) {
            console.log('User is logged in:', token);
        
        } else {
            console.log('User is not logged in');
        }

        // Optional: Subscribe to authStore for real-time updates
        const unsubscribe = authStore.subscribe((currentToken) => {
            if (currentToken) {
                console.log('Auth Updated: User is logged in:', currentToken);
            } else {
                console.log('Auth Updated: User is logged out');
            }
        });

        // Clean up the subscription on component unmount
        return unsubscribe;
	});
</script>

<Toaster />

<slot />
