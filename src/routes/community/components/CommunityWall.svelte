<script lang="ts">
	import { onMount } from 'svelte';
	import CommunityCard from '$lib/components/Cards/CommunityCard.svelte';
	import BottomTabBar from '$lib/components/TabBar/BottomTabBar.svelte';
	import Community from '$lib/icons/CommunityIcon.svelte';
	import Courses from '$lib/icons/CoursesIcon.svelte';
	import MainLogo from '$lib/icons/MainLogoIcon.svelte';
	import Profile from '$lib/icons/ProfileIcon.svelte';
	import { goto } from '$app/navigation';

	import { createEventDispatcher } from 'svelte';

	// Define types
	interface CommunityPost {
		id: number;
		title: string;
		description: string;
		createdAt: string;
		updatedAt: string;
		publishedAt: string;
	}

	interface ApiResponse {
		data: {
			id: number;
			attributes: {
				title: string;
				description: string;
				createdAt: string;
				updatedAt: string;
				publishedAt: string;
			};
		}[];
		meta: {
			pagination: {
				page: number;
				pageSize: number;
				pageCount: number;
				total: number;
			};
		};
	}

	// Tab bar items
	let tabs = [
		{ name: 'Community', icon: Community },
		{ name: 'Workout', icon: Courses },
		{ name: 'Profile', icon: Profile }
	];

	let communityPosts: CommunityPost[] = [];
	let isLoading = true;
	let error = '';

	let activeTab = 0;
	const dispatch = createEventDispatcher();

	function handleClick(event: CustomEvent<number>) {
		activeTab = event.detail;
		dispatch('tabClick', activeTab);
	}

	onMount(async () => {
		try {
			// Fetch token from localStorage
			const token = localStorage.getItem('authToken');

			if (!token) {
				// throw new Error('Authentication token is missing. Please log in.');
				return goto('/login');
			}

			// Fetch data from the API
			const response = await fetch('https://v1.app.aadiyog.in/api/posts?populate[user]=name&populate[highlightImage]=url', {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
			});

			if (!response.ok) {
				throw new Error(`Failed to fetch posts: ${response.statusText}`);
			}

			// Parse and log the response
			const data: ApiResponse = await response.json();
			console.log('API Response:', data);

			// Map data to communityPosts
			communityPosts = data.data.map((item: any) => ({
				id: item.id,
				title: item.attributes.title,
				description: item.attributes.description,
				createdAt: item.attributes.createdAt,
				updatedAt: item.attributes.updatedAt,
				publishedAt: item.attributes.publishedAt,
				user: item.attributes.user?.data?.attributes?.name || 'Unknown', // Fetch user name or fallback
				highlightImage: item.attributes.highlightImage?.data?.[0]?.attributes?.url , // Fetch highlightImage URL or fallback
			}));
		} catch (err) {
			error = err.message || 'An unknown error occurred';
		} finally {
			isLoading = false;
		}
	});
</script>

<!-- Main Content -->
<div class="h-full pt-4 pb-24 flex flex-col items-start w-full overflow-x-hidden">
	<!-- Header -->
	<div class="w-full px-8 flex flex-row items-center">
		<MainLogo width={32} height={32} />
		<h1 class="ml-2">Aadiyog</h1>
	</div>

	<!-- Content Section -->
	{#if isLoading}
	
	<div class="absolute inset-0 flex justify-center items-center bg-white">
		<div class="w-32 h-32  rounded-full flex justify-center items-center animate-pulse">
			<!-- <img src={logo} alt="Logo" class="w-16 h-16" /> -->
			<MainLogo width={104} height={104} />
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
	{/if}

	<!-- Bottom Tab Bar -->
	<div class="fixed bottom-0 left-0 w-full bg-white">
		<BottomTabBar {tabs} id="One" activeTab={activeTab} on:click={handleClick} />
	</div>
</div>

<style>

</style>
