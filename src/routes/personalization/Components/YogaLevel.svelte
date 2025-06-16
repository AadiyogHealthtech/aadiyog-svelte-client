<script lang="ts">
	import { goto } from '$app/navigation';
	import Button from '$lib/components/Button/Button.svelte';
	import IconButton from '$lib/components/Button/IconButton.svelte';
	import Advanced from '$lib/icons/AdvancedIcon.svelte';
	import Beginner from '$lib/icons/BeginnerIcon.svelte';
	import Intermediate from '$lib/icons/IntermediateIcon.svelte';
	import { YogaLevel } from '$lib/messages/User.msg';
	import { userSignupRequestStore } from '$lib/store/userSignupRequestStore';
	import { handelBack } from '$lib/store/navigationStore';
	import Back from '$lib/icons/BackIcon.svelte';

	const totalSteps = 7;
	export let currentStep = 7;

	let selectedAdvanced = $userSignupRequestStore.yogaLevel === YogaLevel.Advanced;
	let selectedIntermediate = $userSignupRequestStore.yogaLevel === YogaLevel.Intermediate;
	let selectedBeginner = $userSignupRequestStore.yogaLevel === YogaLevel.Beginner;

	$: selectedAdvanced && advanced();
	$: selectedIntermediate && intermediate();
	$: selectedBeginner && beginner();

	function advanced() {
		selectedIntermediate = false;
		selectedBeginner = false;
	}
	function intermediate() {
		selectedAdvanced = false;
		selectedBeginner = false;
	}
	function beginner() {
		selectedAdvanced = false;
		selectedIntermediate = false;
	}
	function handleClick() {
		$userSignupRequestStore = {
			...$userSignupRequestStore,
			yogaLevel: selectedAdvanced
				? YogaLevel.Advanced
				: selectedBeginner
					? YogaLevel.Beginner
					: YogaLevel.Intermediate
		};
		goto('/personalization/9');
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
		<div class="flex flex-col items-start w-full px-10 space-y-2 mt-4"> <!-- Added margin-top here -->
			<div class="w-full h-1 bg-gray-200 rounded relative">
				<div
					class="h-full bg-gray-700 rounded transition-all duration-300"
					style="width: {Math.min((currentStep / totalSteps) * 100, 100)}%"
				></div>
			</div>
			<!-- Step Indicator positioned directly below the progress bar, aligned slightly left -->
			<span class="text-sm text-gray-700 ml-2">Step {currentStep}/{totalSteps}</span>
		</div>
		
		<button class="text-sm text-gray-500" on:click={handleSkip}>Skip</button>
	</div>
	<div class="flex flex-col items-center justify-center">
		<h1 class="absolute top-20 left-25 text-black font-bold mt-2 text-2xl sm:text-3xl">
			What is your level in yoga?
		</h1>
	
		<p class="absolute left-25 text-gray-600 mb-3 text-base sm:text-xl mt-8">
			Let us know you better
		</p>
	</div>
	<div class="flex-col justify-center">
		<IconButton id="Advaced" width={32} height={32} rounded={'lg'} bind:selected={selectedAdvanced}>
			<Advanced color={selectedAdvanced ? '#F37003' : '#666666'} />
			<h4 class="text-neutral-grey-3" class:text-primary={selectedAdvanced}>Advanced</h4>
		</IconButton>
		<div class="mt-10">
			<IconButton
				id="Intermediate"
				width={32}
				height={32}
				rounded={'lg'}
				bind:selected={selectedIntermediate}
			>
				<Intermediate color={selectedIntermediate ? '#F37003' : '#333333'} />
				<h4 class="text-neutral-grey-3" class:text-primary={selectedIntermediate}>Intermediate</h4>
			</IconButton>
		</div>
		<div class="mt-10">
			<IconButton
				id="Begineer"
				width={32}
				height={32}
				rounded={'lg'}
				bind:selected={selectedBeginner}
			>
				<Beginner color={selectedBeginner ? '#F37003' : '#333333'} />
				<h4 class="text-neutral-grey-3" class:text-primary={selectedBeginner}>Beginner</h4>
			</IconButton>
		</div>
	</div>
	<Button variant="primary" fullWidth id="Next" on:click={handleClick}>Next</Button>
</div>
