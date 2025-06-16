<script lang="ts">
	import { page } from '$app/stores';
	import Age from '../Components/Age.svelte';
	import Gender from '../Components/Gender.svelte';
	import Height from '../Components/Height.svelte';
	import MedicalCondition from '../Components/MedicalCondition.svelte';
	import MeidcalCondition from '../Components/MedicalCondition.svelte';
	import MenstrualFlow from '../Components/MenstrualFlow.svelte';
	import Signup from '../Components/Signup.svelte';
	import SleepDuration from '../Components/SleepDuration.svelte';
	import Weight from '../Components/Weight.svelte';
	import YogaLevel from '../Components/YogaLevel.svelte';

	let id = 1;
	$: id = parseInt($page.params.id);
</script>

<div class="h-screen flex flex-col items-center justify-center">
	{#if id === 1}
		<Gender />
	{:else if id === 2}
		<Age />
	{:else if id === 3}
		<Height />
	{:else if id === 4}
		<Weight />
	{:else if id === 5}
		<SleepDuration />
	{:else if id === 6}
		<MedicalCondition />
	{:else if id === 7}
		<MenstrualFlow />
	{:else if id === 8}
		<YogaLevel />
	{:else if id === 9}
		<Signup />
	{/if}
</div>
