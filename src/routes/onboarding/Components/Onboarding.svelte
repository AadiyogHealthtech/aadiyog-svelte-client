<script lang="ts">
	import MainLogo from '$lib/icons/MainLogoIcon.svelte';
	import { Splide, SplideSlide, SplideTrack } from '@splidejs/svelte-splide';
	import '@splidejs/svelte-splide/css';
	import Onboarding1 from './Onboarding1.svelte';
	import Onboarding2 from './Onboarding2.svelte';
	import Onboarding3 from './Onboarding3.svelte';
	import Button from '$lib/components/Button/Button.svelte';
	import { createEventDispatcher, onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { initialiseUserDataRequest } from '$lib/store/userSignupRequestStore';
	import Back from '$lib/icons/BackIcon.svelte';

	function handelBack() {
    if (window.history.length > 2) {
        history.go(-2); // Go back two pages in history
    } else {
        goto('/'); // Fallback to the homepage if there’s not enough history
    }
}	
	onMount(() => {
		initialiseUserDataRequest();
	});
	function handleClick() {
		goto('/personalization');
	}
</script>

<div class="h-screen flex flex-col items-center justify-center">
	<div class="px-8 flex flex-row items-center justify-center">
		<button class="absolute top-9 left-8" on:click={handelBack}>
			<Back />
		</button>
	<h1>Signup</h1>
	</div>
	<Splide
		class="py-4 pl-4 w-screen flex items-center justify-center"
		options={{ rewind: false, gap: '1rem', autoplay: true, interval: 2000 }}
		aria-label="Onboarding Screens"
	>
		<SplideSlide>
			<Onboarding1 />
		</SplideSlide>
		<SplideSlide>
			<Onboarding2 />
		</SplideSlide>
		<SplideSlide>
			<Onboarding3 />
		</SplideSlide>
	</Splide>

	<Button class="absolute bottom-10" variant="primary" id="One" on:click={handleClick}
		>Let's start</Button
	>
</div>

<style>
.splide .splide__pagination__page { 
  background-color: #dc0c0c; 
}


</style>


