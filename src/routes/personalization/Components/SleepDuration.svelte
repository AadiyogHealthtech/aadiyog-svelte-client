<script lang="ts">
	import { goto } from '$app/navigation';
	import Button from '$lib/components/Button/Button.svelte';
	import Onboarding3 from '$lib/Images/Onboarding3.png';
	import { userSignupRequestStore } from '$lib/store/userSignupRequestStore';
	import { handelBack } from '$lib/store/navigationStore';
	import Back from '$lib/icons/BackIcon.svelte';

	const totalSteps = 7;
	export let currentStep = 4;

	// Initialize default sleep time to 6 if not already set
	if (!$userSignupRequestStore.sleepTime) {
		userSignupRequestStore.update((store) => ({
			...store,
			sleepTime: 6
		}));
	}

	// Handle slider change
	function handleSliderChange(event: Event) {
		const slider = event.target as HTMLInputElement;
		userSignupRequestStore.update((store) => ({
			...store,
			sleepTime: parseInt(slider.value)
		}));
		// Set CSS variable dynamically for slider track color
		document.documentElement.style.setProperty('--slider-value', `${parseInt(slider.value)}`);
	}

	function handleClick() {
		goto('/personalization/6');
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
	<h1 class="absolute top-40 left-25 text-black font-bold mb-3 text-2xl sm:text-3xl">
		What is your sleep duration?
	</h1>
	<p class="absolute top-40 left-25 text-gray-600 mb-3 text-base sm:text-xl mt-8">
		Let us know you better
	</p>
	<div class="flex flex-col items-center justify-center mt-0">
		<img alt="Onboarding3" src={Onboarding3} class="mt-0" />
		<p class="mt-12 text-lg">{$userSignupRequestStore.sleepTime} hours</p>
		<div class="mt-5 w-full relative">
			<input
				type="range"
				id="sleepTimeSlider"
				min="1"
				max="9"
				step="1"
				bind:value={$userSignupRequestStore.sleepTime}
				on:input={handleSliderChange}
				class="w-full slider"
			/>

			<!-- Dot elements for each value -->
			<div class="dots-wrapper">
				{#each [1, 2, 3, 4, 5, 6, 7, 8, 9] as step}
					<div
						class="dot {step <= $userSignupRequestStore.sleepTime ? 'active' : ''}"
						style="left: {(step - 1) * 12.5}%"
					></div>
				{/each}
			</div>

			<div class="flex justify-between text-sm text-gray-600 mt-2 mx-2">
				<span>1</span>
				<span>2</span>
				<span>3</span>
				<span>4</span>
				<span>5</span>
				<span>6</span>
				<span>7</span>
				<span>8</span>
				<span>9+</span>
			</div>
		</div>
	</div>

	<Button variant="primary" fullWidth id="Next" on:click={handleClick}>Next</Button>
</div>

<style>
	/* Wrapper around dots for relative positioning */
	.dots-wrapper {
		position: absolute;
		top: 8px;
		left: 0;
		width: 100%;
		height: 7px;
		pointer-events: none; /* Prevent interaction */
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	/* Base style for the dots */
	.dot {
		width: 10px;
		height: 10px;
		background-color: gray;
		border-radius: 50%;
		transition: background-color 0.3s;
		position: absolute;
		transform: translateX(-50%);
	}

	/* Active dots */
	.dot.active {
		background-color: white;
	}

	.slider {
		-webkit-appearance: none;
		width: 100%;
		height: 23px;
		background: linear-gradient(
			to right,
			#ff8e21 0%,
			#ff8e21 calc((var(--slider-value, 6) - 1) * 12.5%),
			#ccc calc((var(--slider-value, 6) - 1) * 12.5%),
			#ccc 100%
		);
		border-radius: 20px;
		outline: none;
		position: relative;
		margin: 0 auto;
	}

	/* Slider thumb for WebKit */
	.slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		width: 30px;
		height: 30px;
		background: #ff8e21;
		border-radius: 70%;
		border: 4px solid white;
		cursor: pointer;
		position: relative;
		z-index: 1;
	}

	/* Firefox */
	.slider::-moz-range-thumb {
		width: 20px;
		height: 20px;
		background: #ff8e21;
		border-radius: 50%;
		border: 4px solid white;
		cursor: pointer;
	}

	.slider::-moz-range-progress {
		background-color: #ff8e21;
		height: 8px;
	}
</style>