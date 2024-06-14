<script lang="ts">
	import { goto } from '$app/navigation';
	import Button from '$lib/components/Button/Button.svelte';
	import YogaIllustration from '$lib/Images/YogaIllustration.png';

	function handleClick() {
		goto('/personalization/6');
	}
</script>

<div class="h-screen w-full flex flex-col items-center justify-between px-8 py-8">
	<div class="flex flex-col items-center justify-center">
		<h1 class="text-neutral-grey-3">What is your weight?</h1>
	</div>
	<img alt="YogaIllustration" src={YogaIllustration} />

	<Button variant="primary" fullWidth id="Next" on:click={handleClick}>Next</Button>
</div>
