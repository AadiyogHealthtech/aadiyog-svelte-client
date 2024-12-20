<script lang="ts">
    import { goto } from '$app/navigation';
    import Button from '$lib/components/Button/Button.svelte';
    import PlaylistCard from '$lib/components/Cards/PlaylistCard.svelte';
    import Back from '$lib/icons/BackIcon.svelte';
    import Bookmark from '$lib/icons/BookmarkIcon.svelte';
    import Tick1 from '$lib/icons/Tick1Icon.svelte';
    import PopupBuy from './PopupBuy.svelte';
    import { createEventDispatcher } from 'svelte';

    export let src = '/assets/images/yoga-pose-1.png';
    export let title = 'Yoga in 1 min';
    export let steps = ['Relieve stress from lower pelvic region', 'Improve digestion'];
    export let workouts: any[] = [];
    export let description = 'Yoga se hoga';
    export let accessType = 'free'; // Determines if video is free or paid

    let playlist = workouts?.data?.map((workout) => {
        const attributes = workout.attributes || {};
        return {
            id: workout.id,
            title: attributes.title,
            duration: `${attributes.duration || 0} min`,
            src: src,
            videoUrl: attributes.exercises?.[0]?.videoUrl || '',
        };
    }) || [];

    let activeTab = -1; // No active video initially
    let showModal = false;
    let isVideoPlaying = false; // Track if a video is playing
    let activeVideoIndex: number | null = null; // Track which video is active
    const dispatch = createEventDispatcher();

    function handleClick(index: number) {
        activeTab = index; // Set the clicked video as active
        isVideoPlaying = true; // Mark as playing
        activeVideoIndex = index; // Set the active video index
        dispatch('click', activeTab);
    }

    function handleBack() {
        goto('/'); // Navigate back to the home page
    }

    function handleCourseBuy() {
        if (isVideoPlaying) {
            // Stop the workout if video is playing
            stopWorkout(); // Function to stop the video
            showModal = false; // Close the modal when the workout is stopped
        } else if (accessType === 'free') {
            // For free content, proceed to the post page
            goto('/post');
        } else {
            // Otherwise show the modal for paid plans
            showModal = false; // Close the modal before opening it again (if it was open)
            setTimeout(() => {
                showModal = true;
            }, 0);
        }
    }

    function closeModal() {
        showModal = false; // Close the modal when clicking the close button
    }

    // Function to stop the workout (close the video)
    function stopWorkout() {
        isVideoPlaying = false; // Mark as not playing
        activeVideoIndex = null; // Reset the active video index
        showModal=false;
        closeModal();
        window.location.reload();
        // Optional: Add logic to hide the video player or clear video URL here if needed
        // Example if using video player:
        // videoPlayer.pause();  // Pause the video if you have a reference to the video player
    }
</script>

<style>
    .scroll {
        overflow-y: scroll;
        max-height: calc(100vh - 24rem);
    }
</style>

<div class="h-full pt-12 flex flex-col items-start">
    <!-- Header Section -->
    <div class="relative w-screen flex flex-row items-center">
        <div
            class="absolute top-0 left-8 flex items-center justify-center z-10 w-8 h-8 rounded-full bg-white shadow-lg"
            on:click={handleBack}
        >
            <Back />
        </div>
        <div
            class="absolute top-0 right-8 flex items-center justify-center z-10 w-8 h-8 rounded-full bg-white shadow-lg"
        >
            <Bookmark />
        </div>
        <img class="absolute -top-12 left-0 w-full z-0" {src} alt="Yoga Pose" />
    </div>

    <!-- Description and Playlist -->
    <div
        class="absolute pb-32 top-96 px-8 py-8 w-full rounded-t-3xl z-20 bg-white overflow-y-auto scroll"
    >
        <div>
            <h2 class="text-neutral-grey-3 font-bold">{title}</h2>
            <p class="text-neutral-grey-2 mt-2">{description}</p>

            <h3 class="text-neutral-grey-2 font-bold mt-4">What you’ll get</h3>
            {#each steps as step}
                <div class="flex flex-row items-start my-2">
                    <Tick1 />
                    <h3 class="ml-2 text-neutral-grey-3">{step}</h3>
                </div>
            {/each}
            <div class="w-full h-px bg-neutral-grey-6 -ml-8" />
        </div>
        <div>
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
                />
            {/each}
        </div>
    </div>

    <!-- Bottom Action Buttons -->
    <div class="fixed bottom-0 w-full px-12 py-10 drop-shadow-xl z-30 bg-white flex justify-between">
        {#if isVideoPlaying}
            <Button variant="primary" fullWidth on:click={stopWorkout}>
                Stop Workout
            </Button>
        {:else}
            <Button variant="primary" fullWidth on:click={handleCourseBuy}>
                Post Workout
            </Button>
        {/if}
    </div>

    <!-- Modal for Buying Course -->
    {#if showModal}
        <PopupBuy
            steps={steps}
            plans={[
                { id: 'Yearly', planName: 'Yearly Plan', planPrice: '₹799', totalPrice: '₹799', off: '0%' },
                { id: 'Quarterly', planName: 'Quarterly Plan', planPrice: '₹649', totalPrice: '₹1,947', off: '0%' },
                { id: 'Monthly', planName: 'Monthly Plan', planPrice: '₹499', totalPrice: '₹5,988', off: '0%' }
            ]}
            on:close={closeModal}
        />
    {/if}
</div>
