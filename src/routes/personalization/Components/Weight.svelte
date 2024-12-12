<script lang="ts">
	import { goto } from '$app/navigation';
	import Button from '$lib/components/Button/Button.svelte';
	import { writable, get } from 'svelte/store';
	import { onMount, onDestroy } from 'svelte';
	import { handelBack } from '$lib/store/navigationStore';
	import Back from '$lib/icons/BackIcon.svelte';
	import { userSignupRequestStore } from '$lib/store/userSignupRequestStore';

	const weights = Array.from({ length: 51 }, (_, i) => i + 45);
	const repeatedWeights = [...weights, ...weights, ...weights];

	let selectedWeight = writable(70);
	let scrollContainer: HTMLDivElement | null = null;
	const totalSteps = 7;
	export let currentStep = 3;

	function handleClick() {
		userSignupRequestStore.update((store) => ({
			...store,
			weight: get(selectedWeight) // Store the final selected weight
		}));

		goto('/personalization/6');
	}

	function handleSkip() {
		goto('/personalization/9');
	}

	function scrollToSelectedWeight() {
		if (scrollContainer) {
			const index = repeatedWeights.indexOf(get(selectedWeight));
			const element = scrollContainer.querySelectorAll('.weight-item')[index] as HTMLElement;
			const containerWidth = scrollContainer.clientWidth;
			const offset = element.offsetLeft - containerWidth / 2 + element.clientWidth / 2;
			scrollContainer.scrollTo({ left: offset, behavior: 'smooth' });
		}
	}

	function handleScroll() {
		if (!scrollContainer) return;

		const containerWidth = scrollContainer.clientWidth;
		const centerX = scrollContainer.scrollLeft + containerWidth / 2;
		const weightItems = Array.from(scrollContainer.querySelectorAll('.weight-item'));
		let closestItem: HTMLElement | null = null;
		let minDistance = Infinity;

		weightItems.forEach((item) => {
			const weightItem = item as HTMLElement;
			const itemX = weightItem.offsetLeft + weightItem.clientWidth / 2;
			const distance = Math.abs(centerX - itemX);
			if (distance < minDistance) {
				minDistance = distance;
				closestItem = weightItem;
			}
		});

		if (closestItem) {
			const weightValue = parseInt(closestItem.textContent || '', 10);
			selectedWeight.set(weightValue);
		}
	}

	// To check when scrolling has ended and animate the closest weight into the center
	let isScrolling = false;
	let scrollTimeout: number | undefined;

	function handleScrollEnd() {
		if (scrollTimeout) {
			clearTimeout(scrollTimeout);
		}

		scrollTimeout = setTimeout(() => {
			isScrolling = false;
			animateClosestToCenter();
		}, 150); // 150ms delay to determine scroll end
	}

	function animateClosestToCenter() {
		if (!scrollContainer) return;

		const containerWidth = scrollContainer.clientWidth;
		const centerX = scrollContainer.scrollLeft + containerWidth / 2;
		const weightItems = Array.from(scrollContainer.querySelectorAll('.weight-item'));
		let closestItem: HTMLElement | null = null;
		let minDistance = Infinity;

		weightItems.forEach((item) => {
			const weightItem = item as HTMLElement;
			const itemX = weightItem.offsetLeft + weightItem.clientWidth / 2;
			const distance = Math.abs(centerX - itemX);
			if (distance < minDistance) {
				minDistance = distance;
				closestItem = weightItem;
			}
		});

		if (closestItem) {
			const closestItemX = closestItem.offsetLeft + closestItem.clientWidth / 2;
			const offset = closestItem.offsetLeft - containerWidth / 2 + closestItem.clientWidth / 2;

			// Animate the closest item to the center if it isn't already centered
			if (Math.abs(centerX - closestItemX) > 10) {
				scrollContainer.scrollTo({ left: offset, behavior: 'smooth' });
			}
		}
	}

	onMount(() => {
		scrollToSelectedWeight();
		scrollContainer?.addEventListener('scroll', handleScroll);
		scrollContainer?.addEventListener('scroll', handleScrollEnd);
	});

	onDestroy(() => {
		scrollContainer?.removeEventListener('scroll', handleScroll);
		scrollContainer?.removeEventListener('scroll', handleScrollEnd);
	});
</script>

<div class="h-screen w-full flex flex-col items-center justify-between px-8 py-8">
	<div class="w-full flex items-center justify-between relative">
		<button class="absolute top-2 left-0" on:click={handelBack}>
			<Back />
		</button>

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
		<h1 class="text-gray-600 mb-3 text-2xl sm:text-3xl">What is your weight?</h1>
		<div
			class="flex flex-col items-center bg-white rounded-lg py-2 sm:px-4 w-[90%] sm:w-[70%] max-w-[24rem] h-[4rem] relative overflow-hidden"
		>
			<div
				class="w-[2px] bg-orange-500 absolute top-0 bottom-0 left-1/2 transform -translate-x-1/2"
			></div>

			<div
				bind:this={scrollContainer}
				class="flex items-center space-x-4 overflow-x-scroll pt-4 sm:pt-2 max-h-[6rem] w-full"
			>
				{#each repeatedWeights as weight}
					<div
						class="weight-item w-12 text-center py-2 cursor-pointer text-sm font-medium"
						class:selected={$selectedWeight === weight}
						on:click={() => selectedWeight.set(weight)}
					>
						{weight}
					</div>
				{/each}
			</div>
		</div>

		<!-- Display selected weight below the weight selector -->
		<p class="mt-4 text-gray-700 text-lg font-semibold">{$selectedWeight} kg</p>
	</div>

	<Button variant="primary" fullWidth id="Next" on:click={handleClick}>Next</Button>
</div>

<style>
	.selected {
		font-weight: bold;
		color: black;
	}

	.weight-item {
		min-width: 3rem;
		transition: transform 0.2s ease-in-out;
	}
</style>
