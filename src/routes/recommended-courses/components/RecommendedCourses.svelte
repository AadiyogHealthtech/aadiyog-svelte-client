<script lang="ts">
	import Button from '$lib/components/Button/Button.svelte';
	import IconButton from '$lib/components/Button/IconButton.svelte';
	import ExploreCard from '$lib/components/Cards/ExploreCard.svelte';
	import Back from '$lib/icons/BackIcon.svelte';
	import { createEventDispatcher, onMount, onDestroy } from 'svelte';
	import Height from '../../personalization/Components/Height.svelte';
	import { goto } from '$app/navigation';
	import { getAllCourses } from '$lib/utils/api/services';
	import {
		getAverageRatingFromFeedbacks,
		getImageFromObject,
		getVideosCountFromCourseWorkouts,
		joinWithCommas
	} from '$lib/utils/helpers/courses.helper';
	import { browser } from '$app/environment';

	// Create an observer to watch for DOM changes that might affect the background
	let resizeObserver;
	let mutationObserver;
	
	// Track the current page element
	let pageElement;

	const fetchCourses = async () => {
		try {
			const response = await getAllCourses();
			courses = (response?.data || []).map((course) => ({
				...course?.attributes,
				id: course?.id
			}));
		} catch (error) {
			console.error("Error fetching courses:", error);
		}
	};

	// Reset background at multiple levels to ensure it propagates
	const resetBackgroundColor = () => {
		if (!browser) return;
		
		// Reset at multiple DOM levels to ensure complete coverage
		document.documentElement.style.backgroundColor = 'white';
		document.body.style.backgroundColor = 'white';
		
		// Force repaint by accessing offsetHeight
		document.body.offsetHeight;
		
		// Apply inline styles to the current component container
		if (pageElement) {
			pageElement.style.backgroundColor = 'white';
			pageElement.classList.add('force-white-bg');
		}
	};

	onMount(() => {
		fetchCourses();
		
		// Reset background color on mount
		resetBackgroundColor();
		
		// Setup observers to watch for changes that might affect the background
		if (browser) {
			// Create a resize observer to detect layout changes
			resizeObserver = new ResizeObserver(() => {
				resetBackgroundColor();
			});
			
			// Create a mutation observer to detect style changes
			mutationObserver = new MutationObserver((mutations) => {
				for (const mutation of mutations) {
					if (mutation.type === 'attributes' && 
						(mutation.attributeName === 'style' || mutation.attributeName === 'class')) {
						resetBackgroundColor();
					}
				}
			});
			
			// Start observing the document body and html element
			resizeObserver.observe(document.body);
			mutationObserver.observe(document.body, { attributes: true });
			mutationObserver.observe(document.documentElement, { attributes: true });
			
			// Add a global CSS rule to force white background
			const style = document.createElement('style');
			style.textContent = `
				.force-white-bg, .force-white-bg * {
					background-color: white !important;
				}
				body, html {
					background-color: white !important;
				}
			`;
			document.head.appendChild(style);
		}
	});
	
	onDestroy(() => {
		// Clean up observers when component is destroyed
		if (browser) {
			if (resizeObserver) resizeObserver.disconnect();
			if (mutationObserver) mutationObserver.disconnect();
		}
	});

	let courses = [];
	let activeTab = 0;
	const dispatch = createEventDispatcher();
	
	function handleClick(index: number) {
		activeTab = index;
		dispatch('click', activeTab);
	}
	
	function handleBack() {
		goto('/');
	}
</script>

<!-- Use bind:this to get a reference to the container element -->
<div 
	bind:this={pageElement}
	class="h-screen w-full pt-6 flex flex-col items-start force-white-bg" 
	style="background-color: white !important;"
>
	<div class="w-full px-8 flex flex-row items-center justify-start force-white-bg">
		<button on:click={handleBack} class="focus:outline-none">
			<Back />
		</button>
		
		<h1 class="w-full flex flex-row items-center justify-center text-neutral-grey-3">
			Recommended for you
		</h1>
	</div>

	<div class="flex-1 w-full pt-8 flex flex-col items-start ml-8 force-white-bg overflow-y-auto">
		<div class="flex w-full overflow-x-auto scroll -ml-4 pb-4">
			{#if courses.length === 0}
				<div class="w-full text-center py-8 text-neutral-grey-3">
					Loading courses...
				</div>
			{:else}
				{#each courses as course, i}
					<button on:click={() => handleClick(i)} class="focus:outline-none">
						<ExploreCard
							id={course.id}
							title={course.title}
							topic=""
							duration={course.duration}
							videos={getVideosCountFromCourseWorkouts(course?.workouts)}
							rating={getAverageRatingFromFeedbacks(course?.feedback_and_supports)}
							reviews={course?.feedback_and_supports?.data?.length ?? 0}
							src={getImageFromObject(course?.thumbnailUrl)}
						/>
					</button>
				{/each}
			{/if}
		</div>
	</div>
</div>