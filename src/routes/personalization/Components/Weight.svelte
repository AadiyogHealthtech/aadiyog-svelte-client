<script lang="ts">
	import { goto } from '$app/navigation';
	import Button from '$lib/components/Button/Button.svelte';
	import { writable, get } from 'svelte/store';
	import { onMount, onDestroy } from 'svelte';
	import { handelBack } from '$lib/store/navigationStore';
	import Back from '$lib/icons/BackIcon.svelte';
	import { userSignupRequestStore } from '$lib/store/userSignupRequestStore';
	import Onboarding3 from '$lib/Images/Onboarding3.png';
	// Define the range of weights
	const weights = Array.from({ length: 172 }, (_, i) => i);
	const repeatedWeights = [...weights];

	let selectedWeight = writable(70);
	let scrollContainer: HTMLDivElement | null = null;
	const totalSteps = 7;
	export let currentStep = 3;

	function handleClick() {
		userSignupRequestStore.update((store) => ({
			...store,
			weight: get(selectedWeight) // Store the final selected weight
		}));

		goto('/personalization/5');
	}

	function handleSkip() {
		goto('/personalization/9');
	}

	function scrollToSelectedWeight() {
		if (scrollContainer) {
			const index = repeatedWeights.findIndex(
				(weight) => parseFloat(weight) === parseFloat(get(selectedWeight))
			);
			if (index !== -1) {
				const element = scrollContainer.querySelectorAll('.weight-item')[index] as HTMLElement;
				const containerWidth = scrollContainer.clientWidth;
				const offset = element.offsetLeft - containerWidth / 2.0 + element.clientWidth / 2.0;
				scrollContainer.scrollTo({ left: offset, behavior: 'smooth' });
			}
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

		// Interpolate between closest items if not exactly on one
		if (closestItem) {
			const closestIndex = weightItems.indexOf(closestItem);
			const leftItem = weightItems[closestIndex - 1];
			const rightItem = weightItems[closestIndex + 1];

			if (leftItem && rightItem) {
				const leftX = leftItem.offsetLeft + leftItem.clientWidth / 2;
				const rightX = rightItem.offsetLeft + rightItem.clientWidth / 2;

				const ratio = (centerX - leftX) / (rightX - leftX);
				const leftValue = parseFloat(leftItem.textContent || '0');
				const rightValue = parseFloat(rightItem.textContent || '0');
				const interpolatedValue = leftValue + ratio * (rightValue - leftValue);

				selectedWeight.set(parseFloat(interpolatedValue.toFixed(1)));
			} else {
				// Fallback if there's no left or right neighbor
				const value = parseFloat(closestItem.textContent || '0');
				selectedWeight.set(value);
			}
		}
	}

	onMount(() => {
		scrollToSelectedWeight();
		scrollContainer?.addEventListener('scroll', handleScroll);
	});

	onDestroy(() => {
		scrollContainer?.removeEventListener('scroll', handleScroll);
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
		<h1 class="absolute top-40 left-25 text-black font-bold mb-3 text-2xl sm:text-3xl">
			What is your weight?
		</h1>

		<p class="absolute top-40 left-25 text-gray-600 mb-3 text-base sm:text-xl mt-8">
			Let us know you better
		</p>
		<img alt="Onboarding3" src={Onboarding3} class="mt-4 pt-20" />
		<div
			class="flex flex-col items-center bg-white rounded-lg py-2 sm:px-4 w-[90%] sm:w-[100%] max-w-[24rem] h-[6rem] relative overflow-hidden mt-10"
		>
			<div
				bind:this={scrollContainer}
				class="relative flex items-center space-x-4 overflow-x-scroll pt-4 sm:pt-2 max-h-[8rem] w-[180%] custom-scrollbar mt-1"
			>
				{#each Array.from({ length: 150 }, (_, index) => index + 1) as j}
					<div
						class={j % 5 === 0 ? 'weight-mark3' : j % 5 === 0 ? 'weight-mark2' : 'weight-mark3'}
						style="left: {j * 6.5}px; top : 16px"
					></div>
				{/each}

				{#each repeatedWeights as weight, i}
					<div class="flex flex-col items-center">
						<!-- per kg marking  -->
						<div class="weight-mark2"></div>
						<div class="weight-mark"></div>
						{#each Array.from({ length: 10 }, (_, index) => index + 1) as j}
							<div class="weight-mark3" style="left: {i * 6.5 + j * 1000}px;"></div>
						{/each}
						<div
							class="weight-item text-center py-0 cursor-pointer text-sm font-medium mt-10"
							class:selected={$selectedWeight === weight}
							on:click={() => selectedWeight.set(weight)}
						>
							{weight}
						</div>
					</div>
				{/each}
			</div>
			<div
				class="absolute w-[4px] bg-orange-500"
				style="height: 90%; top: 0%; left: 49.9%; transform: translateX(-50%);"
			></div>
			<div
				class="absolute w-[20px] bg-white"
				style="height: 30%; top: 70%; left: 49.9%; transform: translateX(-50%);"
			></div>
			<div
				class="absolute w-0 h-0 border-l-[8px] border-r-[8px] border-b-[15px] border-transparent border-b-orange-500"
				style="top: 77%; left: 49.9%; transform: translateX(-50%);"
			></div>
		</div>
		<!-- <div
			class="absolute w-[4px] bg-orange-500"
			style="height: 9%; top: 68%; left: 49.9%; transform: translateX(-50%);"
		></div> -->

		<p class="mt-[20px] text-gray-700 text-lg font-semibold">{$selectedWeight} kg</p>
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
	.weight-mark3 {
		height: 1rem;
		width: 2px;
		background-color: #959595;
		position: absolute;
		transform: translateX(-50%);
		top: 10;
	}
	.weight-mark {
		height: 2rem;
		width: 0.15rem;
		margin-left: 190px;
		background-color: #959595;
		position: absolute;

		top: 0.5rem;
		bottom: 0;
	}
	.weight-mark2 {
		height: 3.8rem;
		width: 0.15rem;
		background-color: #959595;
		position: absolute;
		top: -0.8rem;
		bottom: 0;
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
