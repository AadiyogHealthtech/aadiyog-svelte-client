<script lang="ts">
	import { goto } from '$app/navigation';
	import Button from '$lib/components/Button/Button.svelte';

	function handleClick() {
		goto('/personalization/3');
	}
</script>

<div class="h-screen w-full flex flex-col items-center justify-between px-8 py-8">
	<div class="flex flex-col items-center justify-center">
		<h1 class="text-neutral-grey-3">How old are you?</h1>
	</div>

	<Button variant="primary" fullWidth id="Next" on:click={handleClick}>Next</Button>
</div>
