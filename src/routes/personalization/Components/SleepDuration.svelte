<script lang="ts">
	import { goto } from '$app/navigation';
	import Button from '$lib/components/Button/Button.svelte';
	import Onboarding3 from '$lib/Images/Onboarding3.png';

	function handleClick() {
		goto('/personalization/7');
	}
</script>

<div class="h-screen w-full flex flex-col items-center justify-between px-8 py-8">
	<div class="flex flex-col items-center justify-center">
		<h1 class="text-neutral-grey-3">What is your sleep duration?</h1>
	</div>
	<img alt="Onboarding3" src={Onboarding3} />

	<Button variant="primary" fullWidth id="Next" on:click={handleClick}>Next</Button>
</div>
