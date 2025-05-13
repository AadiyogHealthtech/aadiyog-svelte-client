<script lang="ts">
	import { page } from '$app/stores';
	import MobileTest from '../Components/MobileTest.svelte';
	import MobileTest2 from '../Components/MobileTest2.svelte';
	import Monitoring from '../Components/Monitoring.svelte';
	import Monitoring2 from '../Components/Monitoring2.svelte';
	import Startworkout from '../Components/Startworkout.svelte';
	import WorkoutDetails from '../Components/WorkoutDetails.svelte';
	import YogaPose from '../Components/YogaPose.svelte';
	import YogaPost from '../Components/YogaPost.svelte';


	let id = 1;
	$: id = parseInt($page.params.id);
</script>

<div class="h-screen flex flex-col items-center justify-center">
	{#if id === 1}
	<Startworkout/>
	 {:else if id === 2}
		<WorkoutDetails />
	{:else if id === 3}
		<YogaPost />
	 {:else if id === 4}
		<Monitoring2/>
	<!-- {:else if id === 5}
		<Weight />
	{:else if id === 6}
		<SleepDuration />
	{:else if id === 7}
		<MeidcalCondition />
	{:else if id === 8}
		<MenstrualFlow />
	{:else if id === 9}
		<Signup /> --> 
	{/if}
</div>
