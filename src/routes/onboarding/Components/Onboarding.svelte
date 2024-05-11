<script lang="ts">
	import MainLogo from '$lib/icons/MainLogo.svelte';
	import { Splide, SplideSlide, SplideTrack } from '@splidejs/svelte-splide';
	import '@splidejs/svelte-splide/css';
	import Onboarding1 from './Onboarding1.svelte';
	import Onboarding2 from './Onboarding2.svelte';
	import Onboarding3 from './Onboarding3.svelte';
	import Button from '$lib/components/Button/Button.svelte';
</script>

<div class="h-screen flex flex-col items-center justify-center">
	<Splide
		class="w-screen "
		options={{ rewind: false, gap: '1rem' }}
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

	<Button variant="primary" id="One">Let's start</Button>
</div>
