<script>
	import { onMount } from 'svelte';
	import RightArrow from '$lib/icons/RightArrowIcon.svelte';
	import Back from '$lib/icons/BackIcon.svelte';
	let selectedTab = 'progress'; // Default selected tab
	import { authStore } from '$lib/store/authStore';
	import { getUserData, getUserPost } from '$lib/utils/api/services';
	import UserWorkouts from '$lib/components/Cards/UserWorkouts.svelte';
	import CommunityCard from '$lib/components/Cards/CommunityCard.svelte';
	export let userId;
	// Sample Data
	let progressData = {
		workoutTime: { weeklyHours: 8, avgHours: 1.2, days: [1, 1.5, 1, 2, 1, 2, 1] },
		caloriesBurned: { weeklyCal: 800, avgCal: 144, days: [100, 200, 150, 180, 220, 250, 170] }
	};

	let workoutsData = {
		message: 'Workout data goes here!' // Replace with actual workout data
	};

	function switchTab(tab) {
		selectedTab = tab;
	}

	let userPost = [];
	let errorMessage = '';
	let isLoading = true; // Loading state

	onMount(() => {
		if (!$authStore) {
			goto('/user-profile/2');
		}
		async function fetchUserPost() {
			try {
				userId = localStorage.getItem('userId');
				if (!userId) {
					errorMessage = 'User ID not found in local storage.';
					isLoading = false;
					return;
				}
				const data = await getUserPost(userId);
				userPost = data ? (Array.isArray(data) ? data : [data]) : [];
				if (!userPost) {
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
<div class="px-10">
	<div class="flex justify-center space-x-4 mt-4 pt-6">
		<button
			class="tab {selectedTab === 'progress' ? 'active' : 'inactive'}"
			on:click={() => switchTab('progress')}
		>
			Progress
		</button>
		<button
			class="tab {selectedTab === 'workouts' ? 'active' : 'inactive'}"
			on:click={() => switchTab('workouts')}
		>
			Workouts
		</button>
	</div>
<!-- Content -->
{#if selectedTab === 'progress'}
<div class="mt-4">
	<div class="flex flex-row items-center mt-8">
		<Back color="#F37003" />
		<h2 class="text-neutral-grey-3 font-semibold mx-4">Last 7 days</h2>
		<RightArrow />
	</div>
	<h2 class="font-lato font-semibold text-[18px] leading-[18px] tracking-[0.4px] mt-4">Workout time</h2>

	<div class="flex flex-row mt-4">
		<div>
			<h2 class="text-neutral-grey-3 font-bold">{progressData.workoutTime.weeklyHours}</h2>
			<h2 class="text-neutral-grey-5 font-normal">{progressData.workoutTime.avgHours}</h2>
		</div>

		<div class="ml-8">
			<h2 class="text-neutral-grey-3 font-bold">114</h2>
			<h2 class="text-neutral-grey-5 font-normal">Average Cal Per Day</h2>
		</div>
	</div>
	<div class="chart-container">
		{#each progressData.workoutTime.days as hours, index}
			<div class="bar-wrapper">
				<div class="bar-bg">
					<div class="bar" style="height: {hours * 40}px;"></div>
				</div>
				<p class="day-label">{['S', 'M', 'T', 'W', 'T', 'F', 'S'][index]}</p>
			</div>
		{/each}
	</div>
<h2 class="font-lato font-semibold text-[18px] leading-[18px] tracking-[0.4px] mt-4">Calories Burned</h2>
	<div class="flex flex-row mt-4">
		<div>
			<h2 class="text-neutral-grey-3 font-bold">{progressData.caloriesBurned.weeklyCal}</h2>
			<h2 class="text-neutral-grey-5 font-normal">{progressData.workoutTime.avgHours}</h2>
		</div>

		<div class="ml-8">
			<h2 class="text-neutral-grey-3 font-bold">114</h2>
			<h2 class="text-neutral-grey-5 font-normal">Average Cal Per Day</h2>
		</div>
	</div>
	<div class="chart-container">
		
		{#each progressData.workoutTime.days as hours, index}
			<div class="bar-wrapper">
				<div class="bar-bg">
					<div class="bar" style="height: {hours * 40}px;"></div>
				</div>
				<p class="day-label">{['S', 'M', 'T', 'W', 'T', 'F', 'S'][index]}</p>
			</div>
		{/each}
	</div>
</div>
{:else}
<div class="mt-4">
	{#each userPost as post (post.id)}
		<!-- Divider -->

		<!-- Post Container with white background -->
		<div class="w-full">
			<UserWorkouts {post} />
		  </div>
	{/each}
	
</div>
{/if}

</div>

<style>

.tab {
		padding: 10px 30px;
		border-radius: 20px;
		font-weight: bold;
		cursor: pointer;
	}
	.active {
		background: black;
		color: white;
	}
	.inactive {
		background: #e0e0e0;
		color: gray;
	}
	.chart-container {
	position: relative; 
    margin-top: 80px;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    height: 120px;
    padding-right: 40px;
}
.bar-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
}
.bar-bg {
    width: 19px;
    height: 161px;
    background-color: #ffccbb; /* Light background color */
    border-radius: 26px;
    display: flex;
    align-items: flex-end; /* Aligns the darker part to the bottom */
    overflow: hidden; /* Ensures bars don't overflow */
}

.bar {
    width: 19px;
    background-color: #F37003; /* Dark color */
    border-radius: 26px;
}
</style>
