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
	import { createEventDispatcher } from 'svelte';
	import { goto } from '$app/navigation';
	export let userId;
	export let name;
	// Sample Data
	let progressData = {
		workoutTime: { weeklyHours: 8, avgHours: 1.2, days: [1.7, 1.5, 1, 3, 1, 2, 1] },
		caloriesBurned: { weeklyCal: 800, avgCal: 144, days: [100, 200, 150, 180, 220, 250, 170] }
	};

	let workoutsData = {
		message: 'Workout data goes here!' // Replace with actual workout data
	};

	function switchTab(tab) {
		selectedTab = tab;
	}

	const dispatch = createEventDispatcher();

	function handleCardClick() {
		goto('workout-details')
		console.log("hii")
	}

	let userPost = [];
	let errorMessage = '';
	let isLoading = true; // Loading state

	// Function to calculate bar height responsively
	function getBarHeight(value) {
		return value * 35;
	}

	// Get current day index (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
	// Today is Thursday, May 15, 2025
	const currentDayIndex = new Date(2025, 4, 15).getDay(); // 4 = Thursday

	onMount(() => {
		// const response = await getUserData(userId); // Fetch and set the user's name
		// name = response?.data?.attributes?.name || 'Unknown User';
		async function fetchUserPost() {
			try {
				console.log('ussssssss', userId);
				const data = await getUserPosts(userId);
				
				userPost = Array.isArray(data) ? data : data ? [data] : [];
				console.log("user",userPost);
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
	<div class="flex flex-wrap justify-between space-x-2 sm:space-x-4 md:space-x-8 lg:space-x-20 mt-4 mx-2 pt-0">
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
		<div class="mt-4 mx-1 sm:mx-2">
			<div class="flex flex-row items-center mt-6 sm:mt-8">
				<Back color="#F37003" />
				<h2 class="text-neutral-grey-3 font-semibold mx-2 sm:mx-4 text-sm sm:text-base">This Week</h2>
				<RightArrow />
			</div>
			<h2 class="font-lato font-semibold text-[16px] sm:text-[18px] leading-[18px] tracking-[0.4px] mt-3 sm:mt-4">
				Workout time
			</h2>

			<div class="flex flex-row mt-2 sm:mt-4">
				<div class="w-1/2 sm:w-auto">
					<h2 class="text-neutral-grey-3 font-bold text-sm sm:text-base">{progressData.workoutTime.weeklyHours}</h2>
					<h3 class="text-neutral-grey-5 font-normal text-xs sm:text-sm">Weekly Hours</h3>
				</div>

				<!-- <div class="w-1/2 sm:w-auto ml-2 sm:ml-8">
					<h2 class="text-neutral-grey-3 font-bold text-sm sm:text-base">{progressData.workoutTime.avgHours}</h2>
					<h3 class="text-neutral-grey-5 font-normal text-xs sm:text-sm">Avg. Hours Per Day</h3>
				</div> -->
			</div>
			
			<h2 class="font-lato font-semibold text-[16px] sm:text-[18px] leading-[18px] tracking-[0.4px] mt-3 sm:mt-4">
				Calories Burned
			</h2>
			<div class="flex flex-row mt-2 sm:mt-4">
				<div class="w-1/2 sm:w-auto">
					<h2 class="text-neutral-grey-3 font-bold text-sm sm:text-base">--</h2>
					<h3 class="text-neutral-grey-5 font-normal text-xs sm:text-sm"></h3>
					<!-- <h2 class="text-neutral-grey-3 font-bold text-sm sm:text-base">{progressData.caloriesBurned.weeklyCal}</h2>
					<h3 class="text-neutral-grey-5 font-normal text-xs sm:text-sm">Weekly Cal</h3> -->
				</div>

				<div class="w-1/2 sm:w-auto ml-2 sm:ml-8">
					<h2 class="text-neutral-grey-3 font-bold text-sm sm:text-base"></h2>
					<!-- <h2 class="text-neutral-grey-3 font-bold text-sm sm:text-base">{progressData.caloriesBurned.avgCal}</h2>
					<h3 class="text-neutral-grey-5 font-normal text-xs sm:text-sm">Avg. Cal Per Day</h3> -->
				</div>
			</div>

			
		</div>
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
				<p>No posts found for this user.</p>
			</div>
		{:else}
			{#each userPost.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) as post (post.id)}
				<div class="w-full px-1 sm:px-2 mb-3 sm:mb-4">
					<UserPostsCard userPost={post} name={name} on:click={handleCardClick}/>
				</div>
			{/each}
		{/if}
	</div>
	{/if}
</div>

<style>
	/* Responsive tab styles */
	.tab {
		padding: 8px 16px;  /* Smaller default padding for mobile */
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
	
	/* Responsive chart styles */
	.chart-container {
		position: relative;
		margin-top: 60px;
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		height: 120px;
		padding-right: 20px;
	}
	@media (min-width: 640px) {
		.chart-container {
			margin-top: 80px;
			padding-right: 40px;
		}
	}
	.bar-wrapper {
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	.bar-bg {
		width: 16px;
		height: 120px;
		background-color: #ffccbb;
		border-radius: 26px;
		display: flex;
		align-items: flex-end;
		overflow: hidden;
	}
	.bar-bg.future-day {
		background-color: #d3d3d3; /* Gray color for upcoming days' background */
	}
	@media (min-width: 640px) {
		.bar-bg {
			width: 19px;
			height: 161px;
		}
	}

	.bar {
		width: 100%;
		background-color: #f37003;
		border-radius: 26px;
	}
	.bar.future-day {
		background-color: #d3d3d3; /* Gray color for upcoming days */
	}
	
	/* Responsive adjustments for the bar heights */
	@media (min-width: 640px) {
		:global(.bar) {
			/* The multiplier can be adjusted in the JavaScript function instead */
		}
	}
</style>