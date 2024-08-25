<script lang="ts">
	import { onMount } from 'svelte';
	import Splash from './onboarding/Components/Splash.svelte';
	import Courses from './course-details/Components/Courses.svelte';
	import Onboarding from './onboarding/Components/Onboarding.svelte';
	import { validateSession } from '$lib/utils/helpers/misc.helper';
	let splashScreenVisible = true;
	let user = true;
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
