<!-- <script lang="ts">
	import { onMount } from 'svelte';
	import Splash from './onboarding/Components/Splash.svelte';
	import Courses from './course-details/Components/Courses.svelte';
	import { goto } from '$app/navigation';
	import { validateSession } from '$lib/utils/helpers/misc.helper';

	let splashScreenVisible = true;

	onMount(() => {
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

    let splashScreenVisible = true;
    const SPLASH_SCREEN_TIMEOUT = 3000;

    onMount(() => {
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

