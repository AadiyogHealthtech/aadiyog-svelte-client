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
	function handelBack() {
		if (window.history.length > 2) {
			goto('/');
			// history.go(-1); // Go back two pages in history
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
		<button class="absolute top-9 left-8" on:click={handelBack}>
			<Back />
		</button>
		<h1>Let's start</h1>
		
	</div>
	<h2>Put your phone in front and go 6 steps back</h2>
	<div class="flex flex-col items-center justify-center px-8 py-3">
		<img alt="OnboardingImage1" src={OnboardingImage1} />
		<!-- <p class="font-semibold text-neutral-grey-4 text-lg tracking-wide leading-7 mt-4">
		Join the journey of yoga and fitness with us
	</p> -->
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
