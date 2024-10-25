<script lang="ts">
	import { onMount } from 'svelte';
	import Splash from './onboarding/Components/Splash.svelte';
	import Courses from './course-details/Components/Courses.svelte';
	import Onboarding from './onboarding/Components/Onboarding.svelte';
	import { validateSession } from '$lib/utils/helpers/misc.helper';
	import { userDataStore } from '$lib/store/userDataStore';
	let splashScreenVisible = true;
	let user = $userDataStore;
	onMount(() => {
		const splashDone = sessionStorage.getItem('splashDone');
		if (splashDone) {
			splashScreenVisible = false;
		} else {
			setTimeout(() => {
				splashScreenVisible = false;
				sessionStorage.setItem('splashDone', 'true');
			}, 3000);
		}
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
