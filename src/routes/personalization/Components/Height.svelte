<script lang="ts">
	import { goto } from '$app/navigation';
	import Button from '$lib/components/Button/Button.svelte';
	import { writable } from 'svelte/store';
	import { onMount, onDestroy } from 'svelte';
	import { handelBack } from '$lib/store/navigationStore';
	import Back from '$lib/icons/BackIcon.svelte';
	import { userSignupRequestStore } from '$lib/store/userSignupRequestStore'; // Import the store
	
	let unit = writable<'cm' | 'ft'>('cm'); // Default unit
	// Initialize selectedHeight with the value from the store, default to 157 cm
	let selectedHeight = writable($userSignupRequestStore.height || 157);
	
	const cmHeights = [];
	const ftHeights = [];
	let scrollContainer: HTMLDivElement | null = null; // Explicitly type scrollContainer
	const totalSteps = 7;
	export let currentStep = 2;
	let scrollTimeout: number | undefined;
	
	// Generate height lists for cm and ft
	for (let i = 100; i <= 300; i++) {
		cmHeights.push(i);
	}
	
	for (let i = 4.0; i <= 10.0; i += 0.1) {
		ftHeights.push(i.toFixed(1));
	}
	
	// Function to toggle between cm and ft
	function toggleUnit(newUnit: 'cm' | 'ft') {
		unit.set(newUnit);
		selectedHeight.set(newUnit === 'cm' ? 157 : 4.8); // Reset height to default for selected unit
		scrollToCenter();
	}
	
	// Handle navigation
	function handleClick() {
		goto('/personalization/4');
	}
	
	function handleSkip() {
		goto('/personalization/9');
	}
	
	// Scroll the selected height to the center
	function scrollToCenter() {
		if (scrollContainer) {
			const selectedElement = scrollContainer.querySelector('.height-item.selected');
			if (selectedElement) {
				const containerHeight = scrollContainer.clientHeight;
				const elementOffset = selectedElement.offsetTop - containerHeight / 2 + selectedElement.clientHeight / 2;
				scrollContainer.scrollTo({ top: elementOffset, behavior: 'smooth' });
			}
		}
	}
	
	// Handle scroll and loop height selection
	function handleScroll() {
		if (!scrollContainer) return;
	
		const containerHeight = scrollContainer.clientHeight;
		const centerY = scrollContainer.scrollTop + containerHeight / 2;
		const heightItems = Array.from(scrollContainer.querySelectorAll('.height-item'));
		let closestItem: HTMLElement | null = null;
		let minDistance = Infinity;
	
		heightItems.forEach((item) => {
			const heightItem = item as HTMLElement;
			const itemY = heightItem.offsetTop + heightItem.clientHeight / 2;
			const distance = Math.abs(centerY - itemY);
			if (distance < minDistance) {
				minDistance = distance;
				closestItem = heightItem;
			}
		});
	
		if (closestItem) {
			const heightValue = parseFloat(closestItem.textContent || '');
			selectedHeight.set(heightValue);
	
			// If near start or end, reset scroll position to keep it seamless
			const heightList = $unit === 'cm' ? cmHeights : ftHeights;
			if (scrollContainer.scrollTop < containerHeight) {
				scrollContainer.scrollTop += heightList.length * closestItem.clientHeight;
			} else if (scrollContainer.scrollTop > (heightList.length * 2 * closestItem.clientHeight)) {
				scrollContainer.scrollTop -= heightList.length * closestItem.clientHeight;
			}
		}
		
		// Reset scroll timeout to detect scroll end
		clearTimeout(scrollTimeout);
		scrollTimeout = window.setTimeout(() => {
			// Animate the closest item to the center when scrolling ends
			if (closestItem) {
				const elementOffset = closestItem.offsetTop - containerHeight / 2 + closestItem.clientHeight / 2;
				scrollContainer.scrollTo({ top: elementOffset, behavior: 'smooth' });
			}
		}, 150); // Adjust timeout duration as needed
	}
	
	// Infinite scrolling logic for both cm and ft
	function loopScroll() {
		if (!scrollContainer) return;
		
		const containerHeight = scrollContainer.clientHeight;
		const scrollPosition = scrollContainer.scrollTop;
		const totalHeight = scrollContainer.scrollHeight;
		const scrollBottom = scrollPosition + containerHeight;
		
		const heightList = $unit === 'cm' ? cmHeights : ftHeights;
		const listLength = heightList.length;
		const itemHeight = containerHeight / listLength;
	
		// If scrolled to the bottom, reset scroll position to top
		if (scrollBottom >= totalHeight) {
			scrollContainer.scrollTop = 0;
		} 
		// If scrolled to the top, reset scroll position to bottom
		else if (scrollPosition <= 0) {
			scrollContainer.scrollTop = totalHeight;
		}
	}
	
	onMount(() => {
		// Sync the selected height with the store value when the component mounts
		const storedHeight = $userSignupRequestStore.height;
		if (storedHeight) {
			selectedHeight.set(storedHeight);
		}
		scrollToCenter();
		scrollContainer?.addEventListener('scroll', handleScroll);
		scrollContainer?.addEventListener('scroll', loopScroll);
	});
	
	onDestroy(() => {
		scrollContainer?.removeEventListener('scroll', handleScroll);
		scrollContainer?.removeEventListener('scroll', loopScroll);
		clearTimeout(scrollTimeout);
	});
	
	// Subscribe to selectedHeight and update store whenever it changes
	selectedHeight.subscribe((value) => {
		userSignupRequestStore.update((store) => {
			store.height = value; // Update the height in the store
			return store;
		});
		// console.log('Selected Height:', value);
	});
</script>

<div class="h-screen w-full flex flex-col items-center justify-between px-8 py-8">
	<div class="w-full flex items-center justify-between relative">
		<button class="absolute top-2 left-0" on:click={handelBack}>
			<Back />
		</button>
		
		<!-- Progress Bar -->
		<div class="flex flex-col items-start w-full px-10 space-y-2 mt-4">
			<div class="w-full h-1 bg-gray-200 rounded relative">
			<div class="h-full bg-gray-700 rounded transition-all duration-300" style="width: {Math.min((currentStep / totalSteps) * 100, 100)}%"></div>
			</div>
			<span class="text-sm text-gray-700 ml-2">Step {currentStep}/{totalSteps}</span>
		</div>
		
		<button class="text-sm text-gray-500" on:click={handleSkip}>Skip</button>
	</div>
	
	<div class="flex flex-col items-center justify-center">
		<h1 class="absolute top-40 left-25 text-black font-bold mb-3 text-2xl sm:text-3xl">
			How tall are you?
		</h1>

		<p class="absolute top-40 left-25 text-gray-600 mb-3 text-base sm:text-xl mt-8">
			Let us know you better
		</p>
		
		<div class="flex flex-col items-center bg-transparent rounded-lg py-4 sm:py-6 px-4 sm:px-5 min-h-[24rem] sm:min-h-[25rem] relative max-w-full">
			<div
				class="w-[30%] border-t-2 border-orange-500 absolute top-[87%] left-[33%] transform -translate-y-1/2"
			></div>
			<div
				class="w-[30%] border-t-2 border-orange-500 absolute top-[80%] left-[33%] transform -translate-y-1/2"
			></div>
		
			<!-- Unit Selector Button -->
			<div class="absolute top-[83%] left-[75%] transform -translate-x-1/2 -translate-y-1/2">
			<span class="font-bold text-gray-600">{#if $unit === 'cm'}cm{:else}ft{/if}</span>
			</div>
		
			<div class="flex space-x-4 sm:space-x-5 mb-4 sm:mb-5 mt-10">
			<button
				class={`rounded-full px-3 py-1 sm:px-3 sm:py-2 text-sm sm:text-base font-bold text-center cursor-pointer ${$unit === 'ft' ? 'bg-black text-white' : 'bg-gray-200 text-black'}`}
				on:click={() => toggleUnit('ft')}
			>
				ft
			</button>
			<button
				class={`rounded-full px-3 py-1 sm:px-3 sm:py-2 text-sm sm:text-base font-bold text-center cursor-pointer ${$unit === 'cm' ? 'bg-black text-white' : 'bg-gray-200 text-black'}`}
				on:click={() => toggleUnit('cm')}
			>
				cm
			</button>
			</div>
		
			<div bind:this={scrollContainer} class="absolute top-40 left-0 right-0 mx-auto flex flex-col items-center space-y-2 overflow-y-scroll h-[20rem] pt-12 sm:pt-16 custom-scrollbar">
			{#if $unit === 'cm'}
				{#each cmHeights as height}
				<div
					class={`w-12 text-center py-2 rounded cursor-pointer height-item ${height === $selectedHeight ? ' text-black font-bold selected' : 'text-black'} text-sm`}
				>
					{height}
				</div>
				{/each}
			{:else}
				{#each ftHeights as height}
				<div
					class={`w-12 text-center py-2 rounded cursor-pointer height-item ${parseFloat(height) === $selectedHeight ? ' text-black font-bold selected' : 'text-black'} text-sm`}
				>
					{height}
				</div>
				{/each}
			{/if}
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
		width: 8px; /* Adjust scrollbar width */
		background-color: transparent; /* Make scrollbar background transparent */
	}

	.custom-scrollbar::-webkit-scrollbar-thumb {
		background-color: transparent; /* Make the scrollbar thumb transparent */
	}

	.custom-scrollbar {
		scrollbar-width: thin; /* For Firefox, make the scrollbar thin */
		scrollbar-color: transparent transparent; /* Transparent thumb and track */
	}
</style>
