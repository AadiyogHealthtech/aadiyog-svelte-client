<script lang="ts">
	import { goto } from '$app/navigation';
	import Button from '$lib/components/Button/Button.svelte';
	import IconButton from '$lib/components/Button/IconButton.svelte';
	import Female from '$lib/icons/FemaleIcon.svelte';
	import Male from '$lib/icons/MaleIcon.svelte';
	import { Gender } from '$lib/messages/User.msg';
	import { userSignupRequestStore } from '$lib/store/userSignupRequestStore';
	import { handelBack } from '$lib/store/navigationStore';
	import Back from '$lib/icons/BackIcon.svelte';

	let selectedFemale = $userSignupRequestStore.gender === Gender.Female;
	let selectedMale = $userSignupRequestStore.gender === Gender.Male;

	$: selectedFemale && female();
	$: selectedMale && male();

	function female() {
		selectedMale = false;
	}
	function male() {
		selectedFemale = false;
	}
	function handleClick() {
		if (!selectedFemale && !selectedMale) return;
		$userSignupRequestStore.gender = selectedMale ? Gender.Male : Gender.Female;
		console.log($userSignupRequestStore);
		goto('/personalization/2');
	}
	function handleSkip() {
		goto('/personalization/9');
	}
</script>

<div class="h-screen w-full flex flex-col items-center justify-between px-8 py-8">
	<div class="w-full flex items-center justify-between relative">
		<button class="absolute top-2 left-0" on:click={handelBack}>
			<Back />
		</button>

		<!-- Progress Bar -->
		<div class="flex flex-col items-start w-full px-10 space-y-2 mt-4">
			<!-- Added margin-top here -->
			<!-- <div class="w-full h-1 bg-gray-200 rounded relative">
				<div
					class="h-full bg-gray-700 rounded transition-all duration-300"
					style="width: {Math.min((currentStep / totalSteps) * 100, 100)}%"
				></div>
			</div> -->
			<!-- Step Indicator positioned directly below the progress bar, aligned slightly left -->
			<!-- <span class="text-sm text-gray-700 ml-2">Step {currentStep}/{totalSteps}</span> -->
		</div>

		<button class="text-sm text-gray-500 mt-3.5" on:click={handleSkip}>Skip</button>
	</div>
	<div class="flex flex-col items-center justify-center">
		<h1 class="absolute top-40 left-25 text-black font-bold mb-3 text-2xl sm:text-3xl">
			What is your gender?
		</h1>

		<p class="absolute top-40 left-25 text-gray-600 mb-3 text-base sm:text-xl mt-8">
			Let us know you better
		</p>
	</div>
	<div>
		<IconButton id="Female" width={28} height={28} rounded={'lg'} bind:selected={selectedFemale}>
			<Female color={selectedFemale ? 'stroke-primary' : 'stroke-neutral-grey-5'} />
			<h4 class="text-neutral-grey-3" class:text-primary={selectedFemale}>Female</h4>
		</IconButton>
		<div class="mt-10">
			<IconButton id="Male" width={28} height={28} rounded={'lg'} bind:selected={selectedMale}>
				<Male color={selectedMale ? '#F37003' : '#333333'} />
				<h4 class="text-neutral-grey-3" class:text-primary={selectedMale}>Male</h4>
			</IconButton>
		</div>
	</div>
	<Button variant="primary" fullWidth id="Next" on:click={handleClick}>Next</Button>
</div>
