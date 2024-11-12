<script lang="ts">
	import { goto } from '$app/navigation';
	import Button from '$lib/components/Button/Button.svelte';
	import TextFeild from '$lib/components/InputFeild/TextFeild.svelte';
	import Onboarding3 from '$lib/Images/Onboarding3.png';
	import { userSignupRequestStore } from '$lib/store/userSignupRequestStore';
	import { handelBack } from '$lib/store/navigationStore';
	import Back from '$lib/icons/BackIcon.svelte';
	function handleClick() {
		goto('/personalization/7');
	}
</script>

<div class="h-screen w-full flex flex-col items-center justify-between px-8 py-8">
	<div class="px-8 flex flex-row items-center justify-center">
		<button class="absolute top-9 left-8" on:click={handelBack}>
			<Back />
		</button>
	</div>
	<div class="flex flex-col items-center justify-center">
		<h1 class="text-neutral-grey-3">What is your sleep duration?</h1>
		<input
			type="number"
			id="sleepTime"
			name="sleepTime"
			placeholder="Enter your Sleep Time"
			bind:value={$userSignupRequestStore.sleepTime}
			class="block w-full px-3 py-2 sm:text-sm border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
		/>
	</div>
	<img alt="Onboarding3" src={Onboarding3} />

	<Button variant="primary" fullWidth id="Next" on:click={handleClick}>Next</Button>
</div>
