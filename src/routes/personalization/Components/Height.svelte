<script lang="ts">
	import { goto } from '$app/navigation';
	import Button from '$lib/components/Button/Button.svelte';
	import TextFeild from '$lib/components/InputFeild/TextFeild.svelte';
	import { userSignupRequestStore } from '$lib/store/userSignupRequestStore';

	function handleClick() {
		goto('/personalization/4');
	}
</script>

<div class="h-screen w-full flex flex-col items-center justify-between px-8 py-8">
	<div class="flex flex-col items-center justify-center">
		<h1 class="text-neutral-grey-3">How tall are you?</h1>
		<input
			type="number"
			id="height"
			name="height"
			placeholder="Enter your height"
			bind:value={$userSignupRequestStore.height}
			class="block w-full px-3 py-2 sm:text-sm border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
		/>
	</div>
	<div class="flex flex-row">
		<Button variant="ghost" fullWidth id="ft">ft</Button>
		<div class="ml-10">
			<Button variant="ghost" fullWidth id="cm">cm</Button>
		</div>
	</div>

	<Button variant="primary" fullWidth id="Next" on:click={handleClick}>Next</Button>
</div>
