<script lang="ts">
	import { goto } from '$app/navigation';
	import Button from '$lib/components/Button/Button.svelte';
	import Onboarding3 from '$lib/Images/Onboarding3.png';
	import { userSignupRequestStore } from '$lib/store/userSignupRequestStore';
	import { handelBack } from '$lib/store/navigationStore';
	import Back from '$lib/icons/BackIcon.svelte';

	const totalSteps = 7;
	export let currentStep = 4;

	// Handle slider change
	function handleSliderChange(event: Event) {
		const slider = event.target as HTMLInputElement;
		userSignupRequestStore.update(store => ({
			...store,
			sleepTime: parseInt(slider.value)
		}));
		// Set CSS variable dynamically for slider track color
		document.documentElement.style.setProperty('--slider-value', `${parseInt(slider.value)}`);
	}

	function handleClick() {
		goto('/personalization/7');
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
			<div class="w-full h-1 bg-gray-200 rounded relative">
				<div
					class="h-full bg-gray-700 rounded transition-all duration-300"
					style="width: {Math.min((currentStep / totalSteps) * 100, 100)}%"
				></div>
			</div>
			<span class="text-sm text-gray-700 ml-2">Step {currentStep}/{totalSteps}</span>
		</div>
		
		<button class="text-sm text-gray-500" on:click={handleSkip}>Skip</button>
	</div>

	<div class="flex flex-col items-center justify-center">
		<h1 class="text-neutral-grey-3">What is your sleep duration?</h1>
		<div class="w-full max-w-xs">
			<input
				type="range"
				id="sleepTimeSlider"
				min="0"
				max="9"
				step="1"
				bind:value={$userSignupRequestStore.sleepTime}
				on:input={handleSliderChange}
				class="w-full slider"
			/>
			<div class="flex justify-between text-sm text-gray-600 mt-2">
				<span>0 h</span>
				<span>9+ h</span>
			</div>
		</div>
		<p class="mt-2 text-lg">{$userSignupRequestStore.sleepTime} hours</p> <!-- Display selected sleep time -->
	</div>

	<img alt="Onboarding3" src={Onboarding3} />

	<Button variant="primary" fullWidth id="Next" on:click={handleClick}>Next</Button>
</div>

<style>
	/* CSS Variable for slider value */
	:global(:root) {
		--slider-value: 0;
	}

	/* Base style for the slider */
	.slider {
		-webkit-appearance: none;
		width: 100%;
		height: 8px;
		background: linear-gradient(
			to right,
			#ff5722 0%,
			#ff5722 calc((var(--slider-value) / 9) * 100%), /* Orange up to thumb */
			#ccc calc((var(--slider-value) / 9) * 100%), /* Grey for remainder */
			#ccc 100%
		);
		border-radius: 5px;
		outline: none;
	}

	/* WebKit styling */
	.slider::-webkit-slider-runnable-track {
		width: 100%;
		height: 8px;
		border-radius: 5px;
	}
	.slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		width: 20px;
		height: 20px;
		background: #ff5722;
		border-radius: 50%;
		cursor: pointer;
		margin-top: -6px; /* Center thumb */
	}

	/* Firefox styling */
	.slider::-moz-range-track {
		width: 100%;
		height: 8px;
		background: #ccc;
		border-radius: 5px;
	}
	.slider::-moz-range-progress {
		background-color: #ff5722;
		height: 8px;
		border-radius: 5px;
	}
	.slider::-moz-range-thumb {
		width: 20px;
		height: 20px;
		background: #ff5722;
		border-radius: 50%;
		cursor: pointer;
	}
</style>
