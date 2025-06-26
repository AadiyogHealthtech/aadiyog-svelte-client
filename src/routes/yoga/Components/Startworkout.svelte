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
	import { poseLandmarkerStore } from '$lib/store/poseLandmarkerStore';
	import { writable } from 'svelte/store';

	// Store for loading state
	let isLoading = writable(true);
	let isReady = writable(false);
	let error = writable<string | null>(null);

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
		try {
			isLoading.set(true);
			error.set(null);
			
			const vision = await FilesetResolver.forVisionTasks(
				'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm'
			);
			const poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
				baseOptions: {
					modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`,
					delegate: 'GPU'
				},
				runningMode: 'VIDEO',
				numPoses: 1
			});
			
			poseLandmarkerStore.set(poseLandmarker);
			// console.log('PoseLandmarker loaded successfully');
			isReady.set(true);
		} catch (err) {
			console.error('Error loading PoseLandmarker:', err);
			error.set('Failed to load pose detection. Please refresh the page or check your connection.');
		} finally {
			isLoading.set(false);
		}
	};

	// Handle manual start
	function handleClick() {
		goto('/yoga/2');
	}

	onMount(() => {
		initialiseUserDataRequest();
		createPoseLandmarker();
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

	{#if $isLoading}
		<div class="mt-8 flex flex-col items-center justify-center">
			<!-- Loading spinner -->
			<div class="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
			<p class="mt-4 text-gray-600 font-medium">Setting up camera and pose detection...</p>
		</div>
	{:else if $error}
		<div class="mt-8 flex flex-col items-center justify-center text-center max-w-xs">
			<p class="text-red-500 font-medium mb-4">{$error}</p>
			<button 
				on:click={createPoseLandmarker} 
				class="bg-orange-500 text-white font-semibold px-4 py-2 rounded hover:bg-orange-600 active:bg-orange-700"
			>
				Retry
			</button>
		</div>
	{:else}
		<!-- <div class="mt-8 flex flex-col items-center justify-center">
			<CircularCountdown startValue={5} radius={40} color="orange" />
			<p class="mt-2 text-gray-600 font-medium">Automatically starting...</p>
		</div> -->

		<Button
			class="absolute bottom-10 bg-orange-500 text-white font-semibold px-4 py-2 rounded hover:bg-orange-600 active:bg-orange-700"
			variant="primary"
			id="One"
			on:click={handleClick}
		>
			START WORKOUT NOW
		</Button>
	{/if}
</div>