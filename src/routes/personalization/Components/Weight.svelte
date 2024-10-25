<script lang="ts">
	import { goto } from '$app/navigation';
	import Button from '$lib/components/Button/Button.svelte';
	import TextFeild from '$lib/components/InputFeild/TextFeild.svelte';
	import YogaIllustration from '$lib/Images/YogaIllustration.png';
	import { userSignupRequestStore } from '$lib/store/userSignupRequestStore';

	function handleClick() {
		goto('/personalization/6');
	}
</script>

<div class="h-screen w-full flex flex-col items-center justify-between px-8 py-8">
	<div class="flex flex-col items-center justify-center">
		<h1 class="text-neutral-grey-3">What is your weight?</h1>
		<input
			type="number"
			id="weight"
			name="weight"
			placeholder="Enter your weight"
			bind:value={$userSignupRequestStore.weight}
			class="block w-full px-3 py-2 sm:text-sm border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
		/>
	</div>
	<img alt="YogaIllustration" src={YogaIllustration} />

	<Button variant="primary" fullWidth id="Next" on:click={handleClick}>Next</Button>
</div>
