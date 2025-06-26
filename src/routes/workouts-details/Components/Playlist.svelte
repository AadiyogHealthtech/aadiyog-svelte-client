<script lang="ts">
  import { goto } from '$app/navigation';
  import Button from '$lib/components/Button/Button.svelte';
  import PlaylistCard from '$lib/components/Cards/PlaylistCard.svelte';
  import Back from '$lib/icons/BackIcon.svelte';
  import Bookmark from '$lib/icons/BookmarkIcon.svelte';
  import PopupBuy from './PopupBuy.svelte';
  import { createEventDispatcher, onMount } from 'svelte';
  import MainLogo from '$lib/icons/MainLogoIcon.svelte';
  import { allWorkouts } from '$lib/store/allWorkouts'; // Import the store

  export let src = '/assets/images/yoga-pose-7.png';
  export let title = 'Yoga in 1 min';
  export let steps = ['Relieve stress from lower pelvic region', 'Improve digestion'];
  // Hardcode workouts for testing
  export let workouts: any[] = [
    { id: 1, title: "Test Yoga 1", duration: "5", videoUrl: "test-url-1", extraData: {} },
    { id: 2, title: "Test Yoga 2", duration: "10", videoUrl: "test-url-2", extraData: {} }
  ];
  export let description = 'Yoga se hoga';
  export let accessType = 'free';

  let isLoading = true;
  let playlist =
    workouts?.map((exercise) => {
      // console.log("-->> exercise:", exercise);
      return {
        id: exercise.id,
        title: exercise.title || 'Untitled Exercise',
        duration: `${exercise.duration || 'Unknown'} min`,
        src: src,
        videoUrl: exercise.videoUrl || '',
        extraData: exercise.extraData
      };
    }) || [];

	

  let activeTab = -1;
  let showModal = false;
  let isVideoPlaying = false;
  let activeVideoIndex: number | null = null;
  const dispatch = createEventDispatcher();
  let scrollProgress = 0;
  let playlistContainer: HTMLElement | null = null;

  // Debug workouts and playlist
  // console.log("Initial workouts prop:", workouts);
  // console.log("Initial playlist:", playlist);

  // Reactively log allWorkouts whenever it updates
  $: {
    // console.log("YogaDetail -> allWorkouts:", $allWorkouts);
  }

  function handleWheel(event: WheelEvent) {
    const target = event.target as Node;
    if (playlistContainer && playlistContainer.contains(target)) {
      const { scrollTop, scrollHeight, clientHeight } = playlistContainer;
      const delta = event.deltaY;
      const atTop = scrollTop === 0;
      const atBottom = scrollTop + clientHeight >= scrollHeight;

      if (delta > 0 && atBottom) {
        updateScrollProgress(delta);
      } else if (delta < 0 && atTop) {
        updateScrollProgress(delta);
      }
      return;
    } else {
      event.preventDefault();
      updateScrollProgress(event.deltaY);
    }
  }

  function updateScrollProgress(delta: number) {
    const scrollSpeed = 0.005;
    if (delta > 0) {
      scrollProgress = Math.min(scrollProgress + scrollSpeed * delta, 1);
    } else {
      scrollProgress = Math.max(scrollProgress + scrollSpeed * delta, 0);
    }
  }

  function handleTouchMove(event: TouchEvent) {
    const target = event.target as Node;
    if (playlistContainer && playlistContainer.contains(target)) {
      return;
    }

    event.preventDefault();
    const touch = event.touches[0];
    const currentY = touch.clientY;

    if (lastTouchY !== null) {
      const delta = lastTouchY - currentY;
      const scrollSpeed = 0.01;
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
      // Add a slight delay to ensure onMount completes
      setTimeout(() => {
        // console.log("Navigating to /yoga/1, allWorkouts should be set:", $allWorkouts);
        goto('/yoga/1');
      }, 500);
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
    // Save the playlist array to the store when the component mounts
    // console.log("Setting allWorkouts to playlist:", playlist);
    allWorkouts.set(workouts);

    setTimeout(() => {
      isLoading = false;
    }, 2000);

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  });
</script>

<!-- HTML and styles remain unchanged -->
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
      <div
        class="absolute top-0 left-8 flex items-center justify-center z-10 w-8 h-8 rounded-full bg-white shadow-lg"
        on:click={handleBack}
      >
        <Back />
      </div>
      <div
        class="absolute top-0 right-8 flex items-center justify-center z-10 w-8 h-8 bg-white shadow-lg"
      >
        <Bookmark />
      </div>
      <img class="absolute -top-12 left-0 w-full z-0" {src} alt="Yoga Pose" />
    </div>

    <!-- Description and Playlist -->
    <div
      class="absolute top-96 px-8 w-full z-20 bg-white description"
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
            src={item.src}
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
  :global(body) {
    overflow: hidden;
  }

  .description {
    width: 100%;
  }

  .playlist-container {
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

  .h-screen {
    height: 100vh;
  }

  .w-screen {
    width: 100vw;
  }

  .fixed {
    position: fixed;
  }

  .top-0 {
    top: 0;
  }

  .left-0 {
    left: 0;
  }

  .overflow-hidden {
    overflow: hidden;
  }

  .flex {
    display: flex;
  }

  .flex-col {
    flex-direction: column;
  }

  .items-start {
    align-items: flex-start;
  }

  .relative {
    position: relative;
  }

  .flex-row {
    flex-direction: row;
  }

  .items-center {
    align-items: center;
  }

  .mt-4 {
    margin-top: 1rem;
  }

  .absolute {
    position: absolute;
  }

  .left-8 {
    left: 2rem;
  }

  .justify-center {
    justify-content: center;
  }

  .z-10 {
    z-index: 10;
  }

  .w-8 {
    width: 2rem;
  }

  .h-8 {
    height: 2rem;
  }

  .rounded-full {
    border-radius: 9999px;
  }

  .bg-white {
    background-color: #fff;
  }

  .shadow-lg {
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  }

  .right-8 {
    right: 2rem;
  }

  .-top-12 {
    top: -3rem;
  }

  .w-full {
    width: 100%;
  }

  .z-0 {
    z-index: 0;
  }

  .top-96 {
    top: 24rem;
  }

  .px-8 {
    padding-left: 2rem;
    padding-right: 2rem;
  }

  .z-20 {
    z-index: 20;
  }

  .sticky {
    position: sticky;
  }

  .pt-2 {
    padding-top: 0.5rem;
  }

  .pb-4 {
    padding-bottom: 1rem;
  }

  .text-neutral-grey-3 {
    color: #4b5563; /* Approximation */
  }

  .mt-5 {
    margin-top: 1.25rem;
  }

  .font-bold {
    font-weight: 700;
  }

  .text-neutral-grey-2 {
    color: #6b7280; /* Approximation */
  }

  .mt-2 {
    margin-top: 0.5rem;
  }

  .h-px {
    height: 1px;
  }

  .bg-neutral-grey-6 {
    background-color: #d1d5db; /* Approximation */
  }

  .mx-auto {
    margin-left: auto;
    margin-right: auto;
  }

  .bottom-0 {
    bottom: 0;
  }

  .px-12 {
    padding-left: 3rem;
    padding-right: 3rem;
  }

  .py-10 {
    padding-top: 2.5rem;
    padding-bottom: 2.5rem;
  }

  .drop-shadow-xl {
    filter: drop-shadow(0 20px 13px rgba(0, 0, 0, 0.03)) drop-shadow(0 8px 5px rgba(0, 0, 0, 0.08));
  }

  .z-30 {
    z-index: 30;
  }

  .justify-between {
    justify-content: space-between;
  }

  .w-32 {
    width: 8rem;
  }

  .h-32 {
    height: 8rem;
  }

  .animate-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
</style>