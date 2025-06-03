<script lang="ts">
	import Back from '$lib/icons/BackIcon.svelte';
	import Button from '$lib/components/Button/Button.svelte';
	import { onMount } from 'svelte';
	import MainLogo from '$lib/icons/MainLogoIcon.svelte';
	import { goto } from '$app/navigation';
	import { initialiseUserDataRequest } from '$lib/store/userSignupRequestStore';
	import OnboardingImage1 from '$lib/Images/Onboarding1.png';
	import CircularCountdown from '$lib/components/countdown/CircularCountdown.svelte';
	import { PoseLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
	import { poseLandmarkerStore } from '$lib/store/poseLandmarkerStore'; // Create a store for PoseLandmarker

	// Function to handle back navigation
	function handelBack() {
		if (window.history.length > 2) {
			goto('/');
		} else {
			goto('/'); // Fallback to the homepage
		}
	}

	// Function to create and load PoseLandmarker
	const createPoseLandmarker = async () => {
		const vision = await FilesetResolver.forVisionTasks(
			'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm'
		);
		const poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
			baseOptions: {
				modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`,
				delegate: 'GPU'
			},
			runningMode: 'VIDEO', // Set running mode to VIDEO
			numPoses: 1
		});
		poseLandmarkerStore.set(poseLandmarker); // Store it globally
		console.log('PoseLandmarker loaded successfully');
	};

	// Handle manual start
	function handleClick() {
		goto('/yoga/2');
	}

	onMount(() => {
		initialiseUserDataRequest();
		// Start loading PoseLandmarker immediately
		createPoseLandmarker();
		// Navigate after 5 seconds
		setTimeout(() => goto('/yoga/2'), 100000); // Adjusted to 5 seconds to match countdown
	});
</script>

<div class="h-screen flex flex-col items-center justify-center bg-white">
	<div class="px-8 flex flex-row items-center justify-center">
		<button class="absolute top-9 left-8" on:click={handelBack}>
			<Back />
		</button>
		<h1>Let's start</h1>
	</div>
	<h2 class="text-center">Put your phone in front and go 6 steps back</h2>
	<div class="flex flex-col items-center justify-center px-8 py-3">
		<img alt="OnboardingImage1" src={OnboardingImage1} />
	</div>

	<div class="mt-8 flex flex-col items-center justify-center">
		<CircularCountdown startValue={5} radius={40} color="orange" />
		<p class="mt-2 text-gray-600 font-medium">Automatically starting...</p>
	</div>

	<Button
		class="absolute bottom-10 bg-orange-500 text-white font-semibold px-4 py-2 rounded hover:bg-orange-600 active:bg-orange-700"
		variant="primary"
		id="One"
		on:click={handleClick}
	>
		START WORKOUT NOW
	</Button>
</div>