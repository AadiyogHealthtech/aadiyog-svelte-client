<script lang="ts">
	import Back from '$lib/icons/BackIcon.svelte';
	import Button from '$lib/components/Button/Button.svelte';
	import { createEventDispatcher, onMount } from 'svelte';
	import MainLogo from '$lib/icons/MainLogoIcon.svelte';
	import { Splide, SplideSlide, SplideTrack } from '@splidejs/svelte-splide';
	import '@splidejs/svelte-splide/css';
	import { goto } from '$app/navigation';
	import { initialiseUserDataRequest } from '$lib/store/userSignupRequestStore';
	import OnboardingImage1 from '$lib/Images/Onboarding1.png';
	import CircularCountdown from '$lib/components/countdown/CircularCountdown.svelte';
	let progressValue = 20; 

	function handelBack() {
		if (window.history.length > 2) {
			history.go(-1); // Go back two pages in history
		} else {
			goto('/'); // Fallback to the homepage if there’s not enough history
		}
	}
	onMount(() => {
		initialiseUserDataRequest();
	});
	function handleClick() {
		goto('/yoga/2');
	}
</script>

<div class="h-screen flex flex-col items-center justify-center">
	<div class="px-8 flex flex-row items-center justify-center">
		<div>
			<button class="absolute top-9 left-8 flex items-center space-x-2" on:click={handelBack}>
				<Back />
				<p class="pl-6 text-2xl font-bold">bhujangasana</p>

				<!-- <p>Distance Calibrated</p> -->
			</button>
		</div>
		<!-- <div class="absolute top-8 right-8 w-10 h-10 bg-blue-800 rounded-full"></div> -->
		<div class="absolute top-6 right-4">
			<CircularCountdown startValue={5} radius={20} color="blue" />
			
		</div>

		<div>
			<button class="absolute top-14 left-10 flex items-center space-x-2" on:click={handelBack}>
				<!-- <p class="pl-6">bhujangasana</p> -->
			</button>
		</div>
		<!-- <h1>Let's start</h1> -->
	</div>

	<!-- <div class="flex flex-col items-center justify-center px-8 py-3">
		<img alt="OnboardingImage1" src={OnboardingImage1} />
		<p class="font-semibold text-neutral-grey-4 text-lg tracking-wide leading-7 mt-4">
		</p>
	</div> -->
	<!-- <div class="w-[90vw] h-[50vh] bg-gray-200">

    </div> -->

	<div class="flex justify-between w-full gap-4">
		<div class="relative w-4 h-full bg-gray-200 rounded">
			<div class="absolute bottom-0 w-full bg-green-500 rounded" style="height: {progressValue}%"></div>
		</div>
		<div class="w-[80vw] h-[75vh] bg-gray-200 border-4 border-red-500 rounded-lg"></div>


	</div>

	<!-- <div class="flex">

        <div class="bg-gray-500 w-1/4 h-400px flex items-center justify-center text-white">
            Gray Box
        </div>

        <div class="bg-green-500 w-3/4 h-40 flex items-center justify-center text-white">
            Green Box
        </div>
    </div> -->

	<div class="absolute bottom-10 flex w-full justify-between px-10">
		<!-- Toggle Button -->

		<Button
			id="play-btn"
			class="bg-green-500 text-white hover:bg-green-600 px-6 py-3 rounded w-[100px] text-center"
		>
			Play
		</Button>

		<!-- Stop Button -->
		<Button
			id="stop-btn"
			class="bg-red-500 text-white hover:bg-red-600 px-6 py-3 rounded w-[100px] text-center"
			on:click={() => goto('/yoga/3')}
		>
			Stop@
		</Button>
	</div>
</div>
