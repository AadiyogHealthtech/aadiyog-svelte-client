<script lang="ts">
	import { onMount } from 'svelte';
	import CommunityCard from '$lib/components/Cards/CommunityCard.svelte';
	import BottomTabBar from '$lib/components/TabBar/BottomTabBar.svelte';
	import Community from '$lib/icons/CommunityIcon.svelte';
	import Courses from '$lib/icons/CoursesIcon.svelte';
	import MainLogo from '$lib/icons/MainLogoIcon.svelte';
	import Logo from '$lib/Images/aadiyog-hindi.png';
	import Profile from '$lib/icons/ProfileIcon.svelte';
	import startyoga from '$lib/images/start_yoga.png';
	import manualactivity from '$lib/images/manual_activity.png';
	import bell from '$lib/images/bell.png';
	import search from '$lib/images/search.png';
	import { goto } from '$app/navigation';
	import { createEventDispatcher } from 'svelte';
	import { getAllCommunityPosts } from '$lib/utils/api/services';

	interface CommunityPost {
		id: number;
		title: string;
		description: string;
		createdAt: string;
		updatedAt: string;
		publishedAt: string;
		user: string;
		highlightImages: string[];
	}

	let tabs = [
		{ name: 'Community', icon: Community },
		{ name: 'Workout', icon: Courses },
		{ name: 'Profile', icon: Profile }
	];

	let communityPosts: CommunityPost[] = [];
	let isLoading = true;
	let error = '';

	let isFloatingButtonVisible = true;
	let areActionButtonsVisible = false;
	let isBlurred = false; // New state for blur effect
	let lastActiveButton: 'floating' | 'actions' | null = 'floating';
	let previousScrollY = 0;

	const dispatch = createEventDispatcher();

	function handleClick(event: CustomEvent<number>) {
		dispatch('tabClick', event.detail);
	}

	function handleFloatingButtonClick() {
		isFloatingButtonVisible = false;
		areActionButtonsVisible = true;
		isBlurred = true;
		document.body.style.overflow = 'hidden'; // Prevent scrolling
	}

	function handleCloseBlur() {
		isFloatingButtonVisible = true;
		areActionButtonsVisible = false;
		isBlurred = false;
		document.body.style.overflow = 'auto'; // Enable scrolling
	}

	function startYoga() {
		goto('/yoga');
	}

	function manualActivity() {
		goto('/post');
	}

	function handleScroll() {
		let currentScrollY = window.scrollY;

		if (currentScrollY > previousScrollY) {
			// Scrolling down: Hide all buttons
			isFloatingButtonVisible = false;
			areActionButtonsVisible = false;
		} else {
			// Scrolling up: Show the last active button
			if (lastActiveButton === 'floating') {
				isFloatingButtonVisible = true;
			} else if (lastActiveButton === 'actions') {
				isFloatingButtonVisible = true;
			}
		}

		previousScrollY = currentScrollY;
	}

	onMount(async () => {
		try {
			const token = localStorage.getItem('authToken');
			if (!token) {
				return goto('/login');
			}
			communityPosts = await getAllCommunityPosts();
		} catch (err) {
			error = err.message || 'An unknown error occurred';
		} finally {
			isLoading = false;
		}

		window.addEventListener('scroll', handleScroll);
	});
</script>

<div class="h-full pt-4 pb-24 flex flex-col items-start w-full overflow-x-hidden">
	<!-- Blur Overlay -->
	{#if isBlurred}
		<div class="fixed inset-0 backdrop-blur-md z-40" on:click={handleCloseBlur}></div>
	{/if}

	<!-- Header -->
	<div class="w-full px-8 flex flex-row items-center justify-between">
		<!-- Logo and Title -->
		<div class="flex items-center">
			<MainLogo width={32} height={32} />
			<h1 class="ml-2">Aadiyog</h1>
		</div>
	
		<!-- Search and Notification Icons (right side) -->
		<div class="flex space-x-4 items-center">
			<!-- Search Icon -->
			<button class="bg-transparent p-0 rounded-full">
				<img src={search}>
			</button>
			<!-- Notification Icon -->
			<a href="/notification">
				<button class="bg-transparent p-2 rounded-full">
					<img src="{bell}" alt="Notification Bell">
				</button>
			</a>
			
			
		</div>
	</div>
	

	<!-- Content Section -->
	{#if isLoading}
		<div class="absolute inset-0 flex justify-center items-center bg-white">
			<div class="w-50 h-50 rounded-full flex justify-center items-center animate-pulse">
				<img src={Logo} alt="centered image" class="w-100 h-100 rounded-full" />
			</div>
		</div>
	{:else if error}
		<p class="text-center mt-4 text-red-500">{error}</p>
	{:else}
		<div>
			{#each communityPosts as post}
				<div class="w-full overflow-hidden h-2 mt-4 bg-neutral-grey-11" />
				<div class="px-8">
					<CommunityCard {post} />
				</div>
			{/each}
		</div>

		<!-- Floating Button -->
		{#if isFloatingButtonVisible}
			<button
				class="fixed bottom-24 right-5 bg-[#F37003] text-white rounded-full w-16 h-16 shadow-lg flex items-center justify-center text-5xl transition-opacity duration-300 z-50"
				on:click={handleFloatingButtonClick}
			>
				+
			</button>
		{/if}

		<!-- Action Buttons -->
		{#if areActionButtonsVisible}
			<div
				class="fixed bottom-24 right-5 space-y-3 transition-opacity duration-300 flex flex-col items-end z-50"
			>
				<!-- Start Yoga -->
				<div class="flex items-center space-x-2">
					<div class="bg-white text-black px-3 py-2 rounded-lg shadow-md text-sm">Start Yoga</div>
					<button
						class="bg-white rounded-full w-16 h-16 shadow-lg flex items-center justify-center"
						on:click={startYoga}
					>
						<img src={startyoga} />
					</button>
				</div>

				<!-- Manual Activity -->
				<div class="flex items-center space-x-2">
					<div class="bg-white text-black px-3 py-2 rounded-lg shadow-md text-sm">
						Manual Activity
					</div>
					<button
						class="bg-white rounded-full w-16 h-16 shadow-lg flex items-center justify-center"
						on:click={manualActivity}
					>
						<img src={manualactivity} />
					</button>
				</div>
			</div>
		{/if}
	{/if}

	<!-- Bottom Tab Bar -->
	<!-- Bottom Tab Bar -->
	<div
		class="fixed bottom-0 left-0 w-full bg-white z-50 transition duration-300"
		class:is-blurred={isBlurred}
	>
		<BottomTabBar {tabs} id="One" on:click={handleClick} />
	</div>
</div>

<style>
	.backdrop-blur-md {
		backdrop-filter: blur(5px);
	}

	button {
		transition: opacity 0.3s ease-in-out;
	}
	.is-blurred {
		backdrop-filter: blur(10px);
		z-index: 40;
	}
</style>
