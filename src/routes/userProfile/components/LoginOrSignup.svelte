<script lang="ts">
	import Button from '$lib/components/Button/Button.svelte';
	import Back from '$lib/icons/Back.svelte';
	import Google from '$lib/icons/Google.svelte';
</script>

<div class="px-8 py-8 h-screen w-screen">
	<div class="flex flex-row items-center justify-center">
		<button class="absolute top-9 left-8">
			<Back />
		</button>
		<h2 class="text-neutral-grey-3 font-semibold">Login or sign up</h2>
	</div>

	<div class="mt-12">
		<h2 class="text-neutral-grey-2">Enter your mobile number</h2>
		<input
			type="number"
			class="mt-4 w-full px-4 py-3 bg-neutral-grey-11 rounded-md shadow-inner text-lg"
			placeholder="Enter mobile number"
		/>
		<div class="mt-6">
			<Button id="Continue" variant="primary" fullWidth>Continue</Button>
		</div>
	</div>

	<div class="flex flex-row mt-12 items-center justify-center w-screen">
		<div class="bg-neutral-grey-6 h-px w-screen -ml-16" />
		<div class="absolute px-2 py-2 -ml-16 bg-white flex items-center justify-center">
			<h3 class="text-neutral-grey-4 font-semibold">or</h3>
		</div>
	</div>

	<div class="relative mt-12">
		<div class="absolute top-2.5 left-4">
			<Google />
		</div>
		<Button id="Google" fullWidth variant="ghost">
			<h3 class="text-neutral-grey-2 font-normal">Continue with Google</h3>
		</Button>
	</div>
</div>
