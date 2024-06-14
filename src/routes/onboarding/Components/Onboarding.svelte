<script lang="ts">
	import MainLogo from '$lib/icons/MainLogo.svelte';
	import { Splide, SplideSlide, SplideTrack } from '@splidejs/svelte-splide';
	import '@splidejs/svelte-splide/css';
	import Onboarding1 from './Onboarding1.svelte';
	import Onboarding2 from './Onboarding2.svelte';
	import Onboarding3 from './Onboarding3.svelte';
	import Button from '$lib/components/Button/Button.svelte';
	import { createEventDispatcher } from 'svelte';
	import { goto } from '$app/navigation';

	let currentSlide = 0;
	let activateButton = false;
	$: activateButton = currentSlide === 2;

	const dispatch = createEventDispatcher();
	function handleChange(e: any) {
		currentSlide = e.detail.Slide.index;
	}
	function handleClick() {
		goto('/personalization');
	}
</script>

<div class="h-screen flex flex-col items-center justify-center">
	<Splide
		class="py-4 pl-4 w-screen flex items-center justify-center"
		options={{ rewind: false, gap: '1rem' }}
		aria-label="Onboarding Screens"
		on:active={handleChange}
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

	{#if activateButton}
		<Button class="absolute bottom-10" variant="primary" id="One" on:click={handleClick}
			>Let's start</Button
		>
	{:else}
		<Button disabled={true} class="absolute bottom-10" variant="primary" id="One"
			>Let's start</Button
		>
	{/if}
</div>
