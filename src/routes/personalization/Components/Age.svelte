<script lang="ts">
	import { goto } from '$app/navigation';
	import Button from '$lib/components/Button/Button.svelte';
	import { writable } from 'svelte/store';
	import { onMount, onDestroy } from 'svelte';
	import { handelBack } from '$lib/store/navigationStore';
	import Back from '$lib/icons/BackIcon.svelte';
	import { userSignupRequestStore } from '$lib/store/userSignupRequestStore';

	const ages = Array.from({ length: 100 }, (_, i) => i + 1); // 18 to 100
	const repeatedAges = [...ages, ...ages, ...ages];

	let selectedAge = writable($userSignupRequestStore.age || 18);
	let scrollContainer: HTMLDivElement | null = null;
	const totalSteps = 7;
	export let currentStep = 1;
	let scrollTimeout: number | null = null;

	function handleClick() {
		goto('/personalization/3');
	}

	function handleSkip() {
		goto('/personalization/9');
	}

	function scrollToSelectedAge() {
		if (scrollContainer) {
			// Find the first occurrence of the selected age in the middle set
			const ageElements = scrollContainer.querySelectorAll('.age-item');
			const middleSetStart = ages.length;
const targetIndex = middleSetStart + 17;  // Index for age 18 (17 because array is 0-based)
			
			const element = ageElements[targetIndex] as HTMLElement;
			if (element) {
				const containerHeight = scrollContainer.clientHeight;
				const offset = element.offsetTop - containerHeight / 2 + element.clientHeight / 2;
				scrollContainer.scrollTop = offset;  // Use direct assignment instead of smooth scroll for initial position
			}
		}
	}

	function handleScroll() {
		if (!scrollContainer) return;

		const containerHeight = scrollContainer.clientHeight;
		const centerY = scrollContainer.scrollTop + containerHeight / 2;
		const ageItems = Array.from(scrollContainer.querySelectorAll('.age-item'));
		let closestItem: HTMLElement | null = null;
		let minDistance = Infinity;

		ageItems.forEach((item) => {
			const ageItem = item as HTMLElement;
			const itemY = ageItem.offsetTop + ageItem.clientHeight / 2;
			const distance = Math.abs(centerY - itemY);
			if (distance < minDistance) {
				minDistance = distance;
				closestItem = ageItem;
			}
		});

		if (closestItem) {
			const ageValue = parseInt(closestItem.textContent || '', 10);
			selectedAge.set(ageValue);

			if (scrollContainer.scrollTop < containerHeight) {
				scrollContainer.scrollTop += ages.length * closestItem.clientHeight;
			} else if (scrollContainer.scrollTop > ages.length * 2 * closestItem.clientHeight) {
				scrollContainer.scrollTop -= ages.length * closestItem.clientHeight;
			}
		}

		if (scrollTimeout) clearTimeout(scrollTimeout);
		scrollTimeout = window.setTimeout(() => {
			if (closestItem) {
				const containerHeight = scrollContainer.clientHeight;
				const offset = closestItem.offsetTop - containerHeight / 2 + closestItem.clientHeight / 2;
				scrollContainer.scrollTo({ top: offset, behavior: 'smooth' });
			}
		}, 200);
	}

	onMount(() => {
		// Set initial age to 18
		selectedAge.set(18);
		// Use setTimeout to ensure the DOM is fully rendered
		setTimeout(() => {
			scrollToSelectedAge();
		}, 0);
		scrollContainer?.addEventListener('scroll', handleScroll);
	});

	onDestroy(() => {
		scrollContainer?.removeEventListener('scroll', handleScroll);
		if (scrollTimeout) clearTimeout(scrollTimeout);
	});

	$: {
		const currentAge = $selectedAge;
		userSignupRequestStore.update((store) => {
			store.age = currentAge;
			return store;
		});
	}
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
		<h1 class="absolute top-40 left-25 text-black font-bold mb-3 text-2xl sm:text-3xl">
			How old are you?
		</h1>

		<p class="absolute top-40 left-25 text-gray-600 mb-3 text-base sm:text-xl mt-8">
			Let us know you better
		</p>

		<div
			class="flex flex-col items-center bg-transparent rounded-lg py-4 sm:py-6 px-4 sm:px-5 min-h-[24rem] sm:min-h-[25rem] relative max-h-[10rem]"
		>
			<div
				class="w-[130%] border-t-2 border-orange-500 absolute top-[87%] left-[-22%] transform -translate-y-1/2"
			></div>
			<div
				class="w-[130%] border-t-2 border-orange-500 absolute top-[80%] left-[-22%] transform -translate-y-1/2"
			></div>

			<div
				bind:this={scrollContainer}
				class="absolute top-40 left-0 right-0 mx-auto flex flex-col items-center space-y-2 overflow-y-scroll h-[20rem] pt-12 sm:pt-16 custom-scrollbar"
			>
				{#each repeatedAges as age}
					<div
						class="age-item w-12 text-center py-2 cursor-pointer text-sm font-medium"
						class:selected={$selectedAge === age}
						on:click={() => selectedAge.set(age)}
					>
						{age}
					</div>
				{/each}
			</div>
		</div>
	</div>

	<Button variant="primary" fullWidth id="Next" on:click={handleClick}>Next</Button>
</div>

<style>
	.selected {
		font-weight: bold;
		color: black;
	}

	.custom-scrollbar::-webkit-scrollbar {
		width: 8px;
		background-color: transparent;
	}

	.custom-scrollbar::-webkit-scrollbar-thumb {
		background-color: transparent;
	}

	.custom-scrollbar {
		scrollbar-width: thin;
		scrollbar-color: transparent transparent;
	}
</style>