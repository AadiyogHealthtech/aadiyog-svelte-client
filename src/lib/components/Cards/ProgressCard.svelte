<script>
	import { onMount } from 'svelte';
	import RightArrow from '$lib/icons/RightArrowIcon.svelte';
	import Back from '$lib/icons/BackIcon.svelte';
	let selectedTab = 'progress'; // Default selected tab
	import { authStore } from '$lib/store/authStore';
	import { getUserData, getUserPosts } from '$lib/utils/api/services';
	import UserWorkouts from '$lib/components/Cards/UserWorkouts.svelte';
	import CommunityCard from '$lib/components/Cards/CommunityCard.svelte';
	import UserPost from '$lib/components/Cards/UserPostsCard.svelte';
	import UserPostsCard from '$lib/components/Cards/UserPostsCard.svelte';
	import ProgressTab from './ProgressTab.svelte';
	import { createEventDispatcher } from 'svelte';
	import { goto } from '$app/navigation';
	
	export let userId;
	export let name;

	let workoutsData = {
		message: 'Workout data goes here!' // Replace with actual workout data
	};

	function switchTab(tab) {
		selectedTab = tab;
	}

	const dispatch = createEventDispatcher();

	//  function handleCardClick(post) {
    //     // Navigate to workout-details with the post data
    //     goto(`/workout-details?id=${post.id}`, {
    //         state: { postData: post }
    //     });
    // }

	let userPost = [];
	let errorMessage = '';
	let isLoading = true; // Loading state

	onMount(() => {
		async function fetchUserPost() {
			try {
				const data = await getUserPosts(userId);
				
				userPost = Array.isArray(data) ? data : data ? [data] : [];
				if (!userPost.length) {
					errorMessage = 'No post found for this user.';
				}
			} catch (error) {
				errorMessage = 'Failed to fetch the user post.';
			} finally {
				isLoading = false;
			}
		}
		fetchUserPost();
	});
</script>

<!-- Tabs -->
<div class="px-4 sm:px-6 md:px-8 lg:px-10 w-full">
	<div class="flex flex-wrap justify-between space-x-2 sm:space-x-4 md:space-x-8 lg:space-x-20 mt-4 mx-5 pt-0">
		<button
		  class="tab {selectedTab === 'progress' ? 'active' : 'inactive'} px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-sm sm:text-base md:text-lg lg:text-xl"
		  on:click={() => switchTab('progress')}
		>
		  Progress
		</button>
		<button
		  class="tab {selectedTab === 'workouts' ? 'active' : 'inactive'} px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-sm sm:text-base md:text-lg lg:text-xl"
		  on:click={() => switchTab('workouts')}
		>
		  Workouts
		</button>
	</div>
	  
	<!-- Content -->
	{#if selectedTab === 'progress'}
		<ProgressTab />
	{:else}
		<div class="mt-4 w-full">
			{#if isLoading}
				<div class="flex justify-center p-4">
					<p>Loading user posts...</p>
				</div>
			{:else if errorMessage}
				<div class="flex justify-center p-4">
					<p class="text-red-500">{errorMessage}</p>
				</div>
			{:else if userPost.length === 0}
				<div class="flex justify-center p-4">
					<p>No posts found! Start workout!</p>
				</div>
			{:else}
				{#each userPost.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) as post (post.id)}
					<div class="w-full px-1 sm:px-2 mb-3 sm:mb-4">
						<!-- <UserPostsCard userPost={post} name={name} on:click={handleCardClick}/> -->
					
					<a href={`/workout-details?id=${post.id}`}>
					<UserPostsCard userPost={post} name={name}/>
					</a>
					</div>
				{/each}
			{/if}
		</div>
	{/if}
</div>

<style>
	/* Responsive tab styles */
	.tab {
		padding: 8px 38px;  /* Smaller default padding for mobile */
		border-radius: 20px;
		font-weight: bold;
		cursor: pointer;
		transition: all 0.2s ease;
	}
	@media (min-width: 640px) {
		.tab {
			padding: 10px 30px;  /* Larger padding for tablets and up */
		}
	}
	.active {
		background: black;
		color: white;
	}
	.inactive {
		background: #e0e0e0;
		color: gray;
	}
</style>