<script lang="ts">
	import { goto } from '$app/navigation';
	import Button from '$lib/components/Button/Button.svelte';
	import PlaylistCard from '$lib/components/Cards/PlaylistCard.svelte';
	import Back from '$lib/icons/BackIcon.svelte';
	import Bookmark from '$lib/icons/BookmarkIcon.svelte';
	import PopupBuy from './PopupBuy.svelte';
	import { createEventDispatcher, onMount } from 'svelte';
	import MainLogo from '$lib/icons/MainLogoIcon.svelte';
	import { workoutStore } from '$lib/store/workoutStore';
	import { allWorkouts } from '$lib/store/allWorkouts';
	
	export let src = '/assets/images/yoga-pose-7.png';
	export let title = 'Yoga in 1 min';
	export let steps = ['Relieve stress from lower pelvic region', 'Improve digestion'];
	export let workouts: any[] = [];
	export let description = 'Yoga se hoga';
	export let accessType = 'free';

	let isLoading = true;
	let playlist = workouts?.data.map((exercise) => {
	// console.log("-->>img is here", exercise.attributes.imgUrl);
	return {
		id: exercise.id,
		title: exercise.attributes.title || 'Untitled Exercise',
		description: exercise.attributes.description,

		// ✅ Use image from S3
		src: exercise.attributes.imgUrl, 

		videoUrl: exercise.attributes.url || '',
		extraData: exercise.attributes.extraData
	};
}) || [];


	let activeTab = -1;
	let showModal = false;
	let isVideoPlaying = false;
	let activeVideoIndex: number | null = null;
	const dispatch = createEventDispatcher();
	let scrollProgress = 0; // Tracks scroll progress (0 to 1)
	let playlistContainer: HTMLElement | null = null; // Reference to playlist-container

	function handleWheel(event: WheelEvent) {
		const target = event.target as Node;
		if (playlistContainer && playlistContainer.contains(target)) {
			// Handle playlist scrolling
			const { scrollTop, scrollHeight, clientHeight } = playlistContainer;
			const delta = event.deltaY;
			const atTop = scrollTop === 0;
			const atBottom = scrollTop + clientHeight >= scrollHeight;

			// Allow description scroll only if playlist is at boundary and direction matches
			if (delta > 0 && atBottom) {
				// Scroll down past bottom: expand description
				updateScrollProgress(delta);
			} else if (delta < 0 && atTop) {
				// Scroll up past top: collapse description
				updateScrollProgress(delta);
			}
			// Allow default scrolling within playlist
			return;
		} else {
			// Scroll outside playlist: update description
			event.preventDefault();
			updateScrollProgress(event.deltaY);
		}
	}

	function updateScrollProgress(delta: number) {
		const scrollSpeed = 0.005; // Adjust for sensitivity
		if (delta > 0) {
			// Scroll down: expand description
			scrollProgress = Math.min(scrollProgress + scrollSpeed * delta, 1);
		} else {
			// Scroll up: collapse description
			scrollProgress = Math.max(scrollProgress + scrollSpeed * delta, 0);
		}
	}

	function handleTouchMove(event: TouchEvent) {
		const target = event.target as Node;
		if (playlistContainer && playlistContainer.contains(target)) {
			// Allow default touch scrolling within playlist
			return;
		}

		event.preventDefault(); // Prevent default touch scrolling outside playlist
		const touch = event.touches[0];
		const currentY = touch.clientY;

		if (lastTouchY !== null) {
			const delta = lastTouchY - currentY; // Positive delta means scrolling down
			const scrollSpeed = 0.01; // Adjust for touch sensitivity
			scrollProgress = Math.min(Math.max(scrollProgress + scrollSpeed * delta, 0), 1);
		}

		lastTouchY = currentY;
	}

	let lastTouchY: number | null = null;

	function handleTouchStart(event: TouchEvent) {
		lastTouchY = event.touches[0].clientY;
	}

	function handleTouchEnd() {
		lastTouchY = null;
	}

	function handleClick(index: number) {
		activeTab = index;
		isVideoPlaying = true;
		activeVideoIndex = index;
		dispatch('click', activeTab);
	}

	function handleBack() {
		goto('/');
	}

	function handleCourseBuy() {
    if (isVideoPlaying) {
      stopWorkout();
      showModal = false;
    } else if (accessType === 'free') {
      workoutStore.set(workouts);
      goto('/yoga/1');
    } else {
      showModal = false;
      setTimeout(() => {
        showModal = true;
      }, 0);
    }
  }

	function closeModal() {
		showModal = false;
	}

	function stopWorkout() {
		isVideoPlaying = false;
		activeVideoIndex = null;
		showModal = false;
		closeModal();
		activeTab = null;
		dispatch('stop', activeTab);
		window.location.reload();
	}

	onMount(() => {
		setTimeout(() => {
			isLoading = false;
		}, 2000);
		allWorkouts.set(playlist)

		// Add global wheel and touch event listeners
		window.addEventListener('wheel', handleWheel, { passive: false });
		window.addEventListener('touchstart', handleTouchStart, { passive: false });
		window.addEventListener('touchmove', handleTouchMove, { passive: false });
		window.addEventListener('touchend', handleTouchEnd, { passive: false });

		return () => {
			// Cleanup event listeners
			window.removeEventListener('wheel', handleWheel);
			window.removeEventListener('touchstart', handleTouchStart);
			window.removeEventListener('touchmove', handleTouchMove);
			window.removeEventListener('touchend', handleTouchEnd);
		};
	});
</script>

{#if isLoading}
	<div class="absolute inset-0 flex justify-center items-center bg-white">
		<div class="w-32 h-32 rounded-full flex justify-center items-center animate-pulse">
			<MainLogo width={104} height={104} />
		</div>
	</div>
{:else}
	<div class="h-screen w-screen fixed top-0 left-0 overflow-hidden flex flex-col items-start">
		<!-- Header Section -->
		<div class="relative w-full flex flex-row items-center mt-4">
			<div class="absolute top-0 left-8 flex items-center justify-center z-10 w-8 h-8" on:click={handleBack}>
  <!-- Base disk -->
  <div class="absolute w-full h-full rounded-full bg-[#E6E6E6]"></div>
  <!-- White circle -->
  <div class="absolute w-6 h-6 rounded-full bg-white"></div>
  <!-- Back icon -->
  <div class="relative">
    <Back color="#333333" />
  </div>
</div>
			<!-- <div
				class="absolute top-0 right-8 flex items-center justify-center z-10 w-8 h-8 bg-white shadow-lg"
			>
				<Bookmark />
			</div> -->
			<div class="absolute top-0 right-8 flex items-center justify-center z-10 w-9 h-9">
  <!-- E6E6E6 disk (base layer) -->
  <div class="absolute w-full h-full rounded-full bg-[#E6E6E6]"></div>
  
  <!-- White circle (middle layer) -->
  <div class="absolute w-8 h-8 rounded-full bg-white"></div>
  
  <!-- Bookmark (top layer) -->
  <div class="relative">
    <Bookmark />
  </div>
</div>
			<img class="absolute -top-12 left-0 w-full z-0" {src} alt="Yoga Pose" />
		</div>

		<!-- Description and Playlist -->
		<div
			class="absolute top-96 px-8 w-full z-20 bg-white description  overflow-x-hidden"
			style="
				transform: translateY({-10 - (72 - 10) * scrollProgress}%);
				height: calc(100vh - {scrollProgress * 20}rem);
				padding-top: {scrollProgress * 1}rem;
				border-radius: 1.5rem;
				transition: transform 0.3s ease-out, height 0.3s ease-out, padding-top 0.3s ease-out;
			"
		>
			<!-- Fixed title and description section -->
			<div class="sticky top-0 bg-white z-10 pt-2 pb-4">
				<h2 class="text-neutral-grey-3 mt-5 font-bold">{title}</h2>
				<p class="text-neutral-grey-2 mt-2">{description}</p>
				<div class="w-full h-px bg-neutral-grey-6 mx-auto mt-4" />
			</div>

			<!-- Scrollable playlist section -->
			<div class="playlist-container" bind:this={playlistContainer}>
				<h1 class="text-neutral-grey-2 mt-4">Playlist</h1>
				{#each playlist as item, index}
					<PlaylistCard
						id={item.id}
						title={item.title}
						duration={item.duration}
						src={item?.src}
						youtubeUrl={item.videoUrl}
						active={index === activeTab}
						on:click={() => handleClick(index)}
						onStop={stopWorkout}
					/>
				{/each}
			</div>
		</div>

		<!-- Bottom Action Buttons -->
		<div
			class="fixed bottom-0 w-full px-12 py-10 drop-shadow-xl z-30 bg-white flex justify-between"
		>
			{#if isVideoPlaying}
				<Button variant="primary" fullWidth on:click={stopWorkout}>Stop Workout</Button>
			{:else}
				<Button variant="primary" fullWidth on:click={handleCourseBuy}>Start Workout</Button>
			{/if}
		</div>

		<!-- Modal for Buying Course -->
		{#if showModal}
			<PopupBuy
				{steps}
				plans={[
					{
						id: 'Yearly',
						planName: 'Yearly Plan',
						planPrice: '₹799',
						totalPrice: '₹799',
						off: '0%'
					},
					{
						id: 'Quarterly',
						planName: 'Quarterly Plan',
						planPrice: '₹649',
						totalPrice: '₹1,947',
						off: '0%'
					},
					{
						id: 'Monthly',
						planName: 'Monthly Plan',
						planPrice: '₹499',
						totalPrice: '₹5,988',
						off: '0%'
					}
				]}
				on:close={closeModal}
			/>
		{/if}
	</div>
{/if}

<style>
	/* Prevent body scrolling */
	:global(body) {
		overflow: hidden;
	}

	.description {
		width: 100%;
	}

	.playlist-container {
		object-fit:fill;
		overflow-x: hidden;
		overflow-y: auto;
		max-height: calc(100vh - 30rem);
		padding-bottom: 8rem;
		-webkit-overflow-scrolling: touch;
		scroll-behavior: smooth;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}
</style>