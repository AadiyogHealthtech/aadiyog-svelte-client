<script lang="ts">
	import { goto } from '$app/navigation';
	import Button from '$lib/components/Button/Button.svelte';
	import PlaylistCard from '$lib/components/Cards/PlaylistCard.svelte';
	import Back from '$lib/icons/BackIcon.svelte';
	import Bookmark from '$lib/icons/BookmarkIcon.svelte';
	import PopupBuy from './PopupBuy.svelte';
	import { createEventDispatcher, onMount } from 'svelte';
	import MainLogo from '$lib/icons/MainLogoIcon.svelte';
	export let src = '/assets/images/yoga-pose-7.png';
	export let title = 'Yoga in 1 min';
	export let steps = ['Relieve stress from lower pelvic region', 'Improve digestion'];
	export let workouts: any[] = [];
	export let description = 'Yoga se hoga';
	export let accessType = 'free';

	let lastScrollTop = 0;
	let isLoading = true; // Set initial loading state
	let playlist =
	workouts?.map((exercise) => {
		return {
			id: exercise.id,
			title: exercise.title || 'Untitled Exercise',
			duration: `${exercise.duration || 'Unknown'} min`, // Assuming "duration" is missing, adjust as needed
			src: src,
			videoUrl: exercise.videoUrl || ''
		};
	}) || [];


	let activeTab = -1;
	let showModal = false;
	let isVideoPlaying = false;
	let activeVideoIndex: number | null = null;
	const dispatch = createEventDispatcher();
	let expanded = false;

	function handleScroll(event: Event) {
		const element = event.target as HTMLElement;
		const currentScrollTop = element.scrollTop;

		if (currentScrollTop > lastScrollTop) {
			expanded = true;
		} else if (currentScrollTop < lastScrollTop) {
			expanded = false;
		}

		lastScrollTop = currentScrollTop <= 0 ? 0 : currentScrollTop;
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
			goto('/post');
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

	// Simulating data fetching or loading completion
	onMount(() => {
		// Example of simulating data load
		setTimeout(() => {
			isLoading = false; // Set isLoading to false after loading is complete
		}, 2000); // Adjust the timeout duration as per your requirement
	});
</script>

{#if isLoading}
	<div class="absolute inset-0 flex justify-center items-center bg-white">
		<div class="w-32 h-32 rounded-full flex justify-center items-center animate-pulse">
			<MainLogo width={104} height={104} />
		</div>
	</div>
{:else}
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
			class="absolute top-96 px-8 py-8 w-full z-20 bg-white overflow-y-auto scroll"
			style={`transform: translateY(${!expanded ? '-10%' : '-72%'}); 
            transition: transform 0.3s, height 0.3s;
            height: ${!expanded ? '100vh' : 'calc(100vh - 20rem)'}; 
            border-radius: ${!expanded ? '1.5rem' : '1.5rem'}; 
            padding-top: ${expanded ? '2rem' : '0'};`}
			on:scroll={handleScroll}
		>
			<div>
				<h2 class="text-neutral-grey-3 mt-5 font-bold">{title}</h2>
				<p class="text-neutral-grey-2 mt-2">{description}</p>
				<div class="w-full h-px bg-neutral-grey-6 mx-auto mt-4" />
			</div>

			<div>
				<h1 class="text-neutral-grey-2 mt-4">Playlist</h1>
				{#each playlist as item, index}
					<PlaylistCard
						id={item.id}
						title={item.title}
						duration={item.duration }
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
	.scroll {
		overflow-y: auto;
		max-height: calc(100vh - 24rem);
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
