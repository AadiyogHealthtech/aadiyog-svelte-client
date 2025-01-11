<script lang="ts">
	import { onMount } from 'svelte';
	import CommunityCard from '$lib/components/Cards/CommunityCard.svelte';
	import BottomTabBar from '$lib/components/TabBar/BottomTabBar.svelte';
	import Community from '$lib/icons/CommunityIcon.svelte';
	import Courses from '$lib/icons/CoursesIcon.svelte';
	import MainLogo from '$lib/icons/MainLogoIcon.svelte';
	import Logo from '$lib/Images/aadiyog-hindi.png';
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
		user: string;
		highlightImages: string[]; // Array to store multiple images
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
				user?: { data: { attributes: { name: string } } };
				highlightImage?: { data: { attributes: { url: string } }[] };
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
		{ name: 'Profile', icon: Profile },
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
				return goto('/login');
			}

			// Fetch data from the API
			const response = await fetch(
				'https://v2.app.aadiyog.in/api/posts?populate[user]=name&populate[highlightImage]=url',
				{
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${token}`,
					},
				}
			);

			if (!response.ok) {
				throw new Error(`Failed to fetch posts: ${response.statusText}`);
			}

			// Parse and log the response
			const data: ApiResponse = await response.json();
			console.log('API Response:', data);

			// Map data to communityPosts
			communityPosts = data.data
				.map((item) => ({
					id: item.id,
					title: item.attributes.title,
					description: item.attributes.description,
					createdAt: item.attributes.createdAt,
					updatedAt: item.attributes.updatedAt,
					publishedAt: item.attributes.publishedAt,
					user: item.attributes.user?.data?.attributes?.name || 'Unknown',
					highlightImages:
						item.attributes.highlightImage?.data?.map(
							(img) => img.attributes.url
						) || [],
				}))
				.sort(
					(a, b) =>
						new Date(b.createdAt).getTime() -
						new Date(a.createdAt).getTime()
				);
		} catch (err) {
			error = err.message || 'An unknown error occurred';
		} finally {
			isLoading = false;
		}
	});
</script>

<div class="h-full pt-4 pb-24 flex flex-col items-start w-full overflow-x-hidden">
	<!-- Header -->
	<div class="w-full px-8 flex flex-row items-center justify-between">
		<!-- Logo and Title Section -->
		<div class="flex items-center">
		  <MainLogo width={32} height={32} />
		  <h1 class="ml-2">Aadiyog</h1>
		</div>
	  
		<!-- Bell Icon Section -->
		<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
			<path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke="#333333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
			<path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21" stroke="#333333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
			</svg>
		  
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
	{/if}

	<!-- Bottom Tab Bar -->
	<div class="fixed bottom-0 left-0 w-full bg-white">
		<BottomTabBar {tabs} id="One" activeTab={activeTab} on:click={handleClick} />
	</div>
</div>

<style>
	/* Add any specific styles here */
</style>
