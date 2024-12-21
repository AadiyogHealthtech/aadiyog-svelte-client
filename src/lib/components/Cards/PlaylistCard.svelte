<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import Play from '$lib/icons/PlayIcon.svelte';
	import CrossIcon from '$lib/icons/CrossIcon.svelte';

	export let id: string;
	export let title: string;
	export let duration: string;
	export let youtubeUrl: string = '';
	export let src: string = '';

	let showModal = false;
	let videoId: string = '';

	const BASE_STYLES = 'py-4 flex flex-row';
	const MODAL_OVERLAY_STYLES =
		'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center';
	const MODAL_CONTENT_STYLES = 'bg-white rounded-lg p-4 relative max-w-4xl w-full mx-4';

	const dispatch = createEventDispatcher();

	$: {
		if (youtubeUrl) {
			console.log({ youtubeUrl });
			// Extract video ID from different YouTube URL formats
			const urlObj = new URL(youtubeUrl);
			if (urlObj.hostname.includes('youtube.com')) {
				videoId = urlObj.searchParams.get('v') || '';
			} else if (urlObj.hostname === 'youtu.be') {
				videoId = urlObj.pathname.slice(1);
			}
		}
	}

	function handleClick(e: MouseEvent) {
		if (youtubeUrl && videoId) {
			showModal = true;
		}
		dispatch('click', e);
	}

	function closeModal() {
		showModal = false;
	}

	// Close modal on escape key press
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			closeModal();
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

<div data-testid={id} class={`${BASE_STYLES} items-start`}>
	<div class="flex-shrink-0 w-[150px] h-[150px] relative">
		<img 
			class="w-full h-full object-cover rounded-lg" 
			alt="CourseImage" 
			{src} 
		/>
		<button
			class="absolute inset-0 flex items-center justify-center hover:scale-110 transition-transform duration-200"
			on:click={handleClick}
			aria-label="Play video"
		>
			<Play />
		</button>
	</div>
	<div class="flex-grow mt-1 ml-4">
		<h2 class="text-neutral-grey-2 font-bold">
			{title}
		</h2>
		<h3 class="text-neutral-grey-4 mt-2">
			{duration}
		</h3>
	</div>
</div>


{#if showModal}
	<div
		class={MODAL_OVERLAY_STYLES}
		on:click|self={closeModal}
		role="dialog"
		aria-labelledby="video-modal-title"
	>
	
		<div class={MODAL_CONTENT_STYLES}>
			<button
				class="absolute -top-10 right-0 p-2 text-white hover:text-gray-300"
				on:click={closeModal}
				aria-label="Close modal"
			>
				<CrossIcon />
			</button>
			<h2 id="video-modal-title" class="sr-only">{title}</h2>
			<div class="relative pt-[56.25%]">
				
				<iframe
					{title}
					class="absolute top-0 left-0 w-full h-full"
					src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
					allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
					allowfullscreen
					modestbranding
				></iframe>
			</div>
		</div>
	</div>
{/if}

<!-- <script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import Play from '$lib/icons/PlayIcon.svelte';
	import CrossIcon from '$lib/icons/CrossIcon.svelte';
	
	export let id: string;
	export let title: string;
	export let duration: string;
	export let youtubeUrl: string = '';
	export let src: string = '';
	
	let showModal = false;
	let videoId: string = '';
	let iframeElement: HTMLIFrameElement | null = null;
	
	const BASE_STYLES = 'py-4 flex flex-row';
	const MODAL_OVERLAY_STYLES =
	  'fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center'; // Full screen overlay with opacity
	const MODAL_CONTENT_STYLES = 'relative w-full h-full p-0'; // No padding for full screen
  
	const dispatch = createEventDispatcher();
	
	// Extract video ID from YouTube URL
	$: {
	  if (youtubeUrl) {
		const urlObj = new URL(youtubeUrl);
		if (urlObj.hostname.includes('youtube.com')) {
		  videoId = urlObj.searchParams.get('v') || '';
		} else if (urlObj.hostname === 'youtu.be') {
		  videoId = urlObj.pathname.slice(1);
		}
	  }
	}
	
	function handleClick(e: MouseEvent) {
	  if (youtubeUrl && videoId) {
		showModal = true;
	  }
	  dispatch('click', e);
	}
	
	function closeModal() {
	  showModal = false;
	}
	
	// Close modal on escape key press
	function handleKeydown(event: KeyboardEvent) {
	  if (event.key === 'Escape') {
		closeModal();
	  }
	}
	
	// Function to trigger fullscreen
	function openFullscreen() {
	  if (iframeElement) {
		const iframeContainer = iframeElement.closest('div');
		if (iframeContainer && iframeContainer.requestFullscreen) {
		  iframeContainer.requestFullscreen();
		}
	  }
	}
	
	// Trigger fullscreen when modal opens
	$: if (showModal) {
	  openFullscreen();
	}
  </script>
	
  <svelte:window on:keydown={handleKeydown} />
	
  <div data-testid={id} class={`${BASE_STYLES} items-start`}>
	<div class="flex-shrink-0 w-[150px] h-[150px] relative">
	  <img class="w-full h-full object-cover rounded-lg" alt="CourseImage" {src} />
	  <button
		class="absolute inset-0 flex items-center justify-center hover:scale-110 transition-transform duration-200"
		on:click={handleClick}
		aria-label="Play video"
	  >
		<Play />
	  </button>
	</div>
	<div class="flex-grow mt-1 ml-4">
	  <h2 class="text-neutral-grey-2 font-bold">{title}</h2>
	  <h3 class="text-neutral-grey-4 mt-2">{duration}</h3>
	</div>
  </div>
	
  {#if showModal}
	<div
	  class={MODAL_OVERLAY_STYLES}
	  on:click|self={closeModal}
	  role="dialog"
	  aria-labelledby="video-modal-title"
	>
	  <div class={MODAL_CONTENT_STYLES}>
		<button
		  class="absolute top-0 right-0 p-2 text-white hover:text-gray-300"
		  on:click={closeModal}
		  aria-label="Close modal"
		>
		  <CrossIcon />
		</button>
		<h2 id="video-modal-title" class="sr-only">{title}</h2>
		<div class="relative w-full h-full">
		  <iframe
			bind:this={iframeElement}
			class="absolute top-0 left-0 w-full h-full"
			src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
			allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
			allowfullscreen
			modestbranding
		  ></iframe>
		</div>
	  </div>
	</div>
  {/if} -->
  
  <!-- <script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import Play from '$lib/icons/PlayIcon.svelte';
	import CrossIcon from '$lib/icons/CrossIcon.svelte';
	
	export let id: string;
	export let title: string;
	export let duration: string;
	export let youtubeUrl: string = '';
	export let src: string = '';
	
	let showModal = false;
	let videoId: string = '';
	let iframeElement: HTMLIFrameElement | null = null;
	
	let workoutStarted = false; // Track whether the workout has started
	
	const BASE_STYLES = 'py-4 flex flex-row';
	const MODAL_OVERLAY_STYLES =
	  'fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center'; // Full screen overlay with opacity
	const MODAL_CONTENT_STYLES = 'relative w-full h-full p-0'; // No padding for full screen
  
	const dispatch = createEventDispatcher();
	
	// Extract video ID from YouTube URL
	$: {
	  if (youtubeUrl) {
		const urlObj = new URL(youtubeUrl);
		if (urlObj.hostname.includes('youtube.com')) {
		  videoId = urlObj.searchParams.get('v') || '';
		} else if (urlObj.hostname === 'youtu.be') {
		  videoId = urlObj.pathname.slice(1);
		}
	  }
	}
	
	function handleClick(e: MouseEvent) {
	  if (youtubeUrl && videoId) {
		showModal = true;
		workoutStarted = true; // Start the workout when the video is opened
	  }
	  dispatch('click', e);
	}
	
	function closeModal() {
	  showModal = false;
	  workoutStarted = false; // Stop the workout when closing the video
	}
	
	// Close modal on escape key press
	function handleKeydown(event: KeyboardEvent) {
	  if (event.key === 'Escape') {
		closeModal();
	  }
	}
	
	// Function to trigger fullscreen
	function openFullscreen() {
	  if (iframeElement) {
		const iframeContainer = iframeElement.closest('div');
		if (iframeContainer && iframeContainer.requestFullscreen) {
		  iframeContainer.requestFullscreen();
		}
	  }
	}
	

	$: if (showModal) {
	  openFullscreen();
	}

	function toggleWorkout() {
	  if (workoutStarted) {
		closeModal(); 
	  } else {
		showModal = true; 
		workoutStarted = true;
	  }
	}
  </script>
  
  <svelte:window on:keydown={handleKeydown} />
  
  <div data-testid={id} class={`${BASE_STYLES} items-start`}>
	<div class="flex-shrink-0 w-[150px] h-[150px] relative">
	  <img class="w-full h-full object-cover rounded-lg" alt="CourseImage" {src} />
	  <button
		class="absolute inset-0 flex items-center justify-center hover:scale-110 transition-transform duration-200"
		on:click={handleClick}
		aria-label="Play video"
	  >
		<Play />
	  </button>
	</div>
	<div class="flex-grow mt-1 ml-4">
	  <h2 class="text-neutral-grey-2 font-bold">{title}</h2>
	  <h3 class="text-neutral-grey-4 mt-2">{duration}</h3>
	</div>
  </div>
  
  <div>
	<button
	  class="mt-4 py-2 px-4 bg-blue-500 text-white rounded-lg"
	  on:click={toggleWorkout}
	>
	  {workoutStarted ? 'Stop Workout' : 'Start Workout'}
	</button>
  </div>
  
  {#if showModal}
	<div
	  class={MODAL_OVERLAY_STYLES}
	  on:click|self={closeModal}
	  role="dialog"
	  aria-labelledby="video-modal-title"
	>
	  <div class={MODAL_CONTENT_STYLES}>
		<button
		  class="absolute top-0 right-0 p-2 text-white hover:text-gray-300"
		  on:click={closeModal}
		  aria-label="Close modal"
		>
		  <CrossIcon />
		</button>
		<h2 id="video-modal-title" class="sr-only">{title}</h2>
		<div class="relative w-full h-full">
		  <iframe
			bind:this={iframeElement}
			class="absolute top-0 left-0 w-full h-full"
			src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
			allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
			allowfullscreen
			modestbranding
		  ></iframe>
		</div>
	  </div>
	</div>
  {/if}
   -->

  <!-- Modify these styles to ensure the modal is full-screen -->
<!-- <script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import Play from '$lib/icons/PlayIcon.svelte';
	import CrossIcon from '$lib/icons/CrossIcon.svelte';
	
	export let id: string;
	export let title: string;
	export let duration: string;
	export let youtubeUrl: string = '';
	export let src: string = '';
	
	let showModal = false;
	let videoId: string = '';
	let iframeElement: HTMLIFrameElement | null = null;
	
	const BASE_STYLES = 'py-4 flex flex-row';
	
	const MODAL_OVERLAY_STYLES =
	  'fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center'; 
	
	const MODAL_CONTENT_STYLES = 'relative w-full h-full p-0';
	
	const dispatch = createEventDispatcher();
	
	$: {
	  if (youtubeUrl) {
		const urlObj = new URL(youtubeUrl);
		if (urlObj.hostname.includes('youtube.com')) {
		  videoId = urlObj.searchParams.get('v') || '';
		} else if (urlObj.hostname === 'youtu.be') {
		  videoId = urlObj.pathname.slice(1);
		}
	  }
	}
	
	function handleClick(e: MouseEvent) {
	  if (youtubeUrl && videoId) {
		showModal = true;
	  }
	  dispatch('click', e);
	}
	
	function closeModal() {
	  showModal = false;
	}
	
	function handleKeydown(event: KeyboardEvent) {
	  if (event.key === 'Escape') {
		closeModal();
	  }
	}
	
	function openFullscreen() {
	  if (iframeElement) {
		const iframeContainer = iframeElement.closest('div');
		if (iframeContainer && iframeContainer.requestFullscreen) {
		  iframeContainer.requestFullscreen();
		}
	  }
	}
	
	// Trigger fullscreen when modal opens
	$: if (showModal) {
	  openFullscreen();
	}
</script>

<svelte:window on:keydown={handleKeydown} />

<div data-testid={id} class={`${BASE_STYLES} items-start`}>
	<div class="flex-shrink-0 w-[150px] h-[150px] relative">
	  <img class="w-full h-full object-cover rounded-lg" alt="CourseImage" {src} />
	  <button
		class="absolute inset-0 flex items-center justify-center hover:scale-110 transition-transform duration-200"
		on:click={handleClick}
		aria-label="Play video"
	  >
		<Play />
	  </button>
	</div>
	<div class="flex-grow mt-1 ml-4">
	  <h2 class="text-neutral-grey-2 font-bold">{title}</h2>
	  <h3 class="text-neutral-grey-4 mt-2">{duration}</h3>
	</div>
</div>

{#if showModal}
	<div
	  class={MODAL_OVERLAY_STYLES}
	  on:click|self={closeModal}
	  role="dialog"
	  aria-labelledby="video-modal-title"
	>
	  <div class={MODAL_CONTENT_STYLES}>
		<button
		  class="absolute top-0 right-0 p-2 text-white hover:text-gray-300"
		  on:click={closeModal}
		  aria-label="Close modal"
		>
		  <CrossIcon />
		</button>
		<h2 id="video-modal-title" class="sr-only">{title}</h2>
		<div class="relative w-full h-full">
		  <iframe
			bind:this={iframeElement}
			class="absolute top-0 left-0 w-full h-full"
			src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
			allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
			allowfullscreen
			modestbranding
		  ></iframe>
		</div>
	  </div>
	</div>
{/if}

   -->