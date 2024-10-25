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
		setTimeout(() => {
			splashScreenVisible = false;
		}, 3000);
		validateSession();
	});
</script>

<div class="">
	{#if splashScreenVisible}
		<Splash />
	{/if}
	{#if !splashScreenVisible}
		{#if !user}
			<Onboarding />
		{:else}
			<Courses />
		{/if}
	{/if}
</div>
