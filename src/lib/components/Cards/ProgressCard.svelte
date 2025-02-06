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
	export let userId;
	export let name;
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
<div class="px-10">
	<div class="flex justify-center space-x-16 mt-4 pt-0">
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
				<h2 class="text-neutral-grey-3 font-semibold mx-4">This Week</h2>
				<RightArrow />
			</div>
			<h2 class="font-lato font-semibold text-[18px] leading-[18px] tracking-[0.4px] mt-4">
				Workout time
			</h2>

			<div class="flex flex-row mt-4">
				<div>
					<h2 class="text-neutral-grey-3 font-bold">{progressData.workoutTime.weeklyHours}</h2>
					<h3 class="text-neutral-grey-5 font-normal">Weekly Hours</h3>
				</div>

				<div class="ml-8">
					<h2 class="text-neutral-grey-3 font-bold">{progressData.workoutTime.avgHours}</h2>
					<h3 class="text-neutral-grey-5 font-normal">Avg. Hours Per Day</h3>
				</div>
			</div>
			<div class="chart-container relative">
				<p
					class="absolute top-[-50%] right-[-35px] transform -translate-y-1/2 text-gray-700 text-sm font-bold"
				>
					2.5h
				</p>
				<div class="relative w-full h-[300px] flex items-end justify-between">
					{#each progressData.workoutTime.days as hours, index}
						<div class="bar-wrapper relative flex flex-col items-center">
							<div
								class="bar-bg relative w-10 h-[200px] bg-gray-200 flex items-end overflow-hidden"
							>
								<!-- Bar (Make sure it's above the line) -->
								<div
									class="bar bg-orange-700 w-full relative z-0"
									style="height: {hours * 40}px;"
								></div>
							</div>
							<p class="day-label mt-2 text-sm">{['S', 'M', 'T', 'W', 'T', 'F', 'S'][index]}</p>
						</div>
					{/each}
				</div>

				<!-- Horizontal Line (Placed Behind Bars) -->
				<div
					class="absolute top-[10%] left-0 w-full border-t border-gray-500 opacity-50 transform -translate-y-1/2 z-0"
				></div>

				<!-- 300 Label at the Top -->
				<p class="absolute top-[3%] right-[-30px] text-gray-700 text-sm font-bold">1h</p>
			</div>
			<h2 class="font-lato font-semibold text-[18px] leading-[18px] tracking-[0.4px] mt-4">
				Calories Burned
			</h2>
			<div class="flex flex-row mt-4">
				<div>
					<h2 class="text-neutral-grey-3 font-bold">{progressData.caloriesBurned.weeklyCal}</h2>
					<h3 class="text-neutral-grey-5 font-normal">Weekly Cal</h3>
				</div>

				<div class="ml-8">
					<h2 class="text-neutral-grey-3 font-bold">{progressData.caloriesBurned.avgCal}</h2>
					<h3 class="text-neutral-grey-5 font-normal">Avg. Cal Per Day</h3>
				</div>
			</div>

			<div class="chart-container relative">
				<p
					class="absolute top-[-50%] right-[-30px] transform -translate-y-1/2 text-gray-700 text-sm font-bold"
				>
					300
				</p>
				<div class="relative w-full h-[300px] flex items-end justify-between">
					{#each progressData.workoutTime.days as hours, index}
						<div class="bar-wrapper relative flex flex-col items-center">
							<div
								class="bar-bg relative w-10 h-[200px] bg-gray-200 flex items-end overflow-hidden"
							>
								<!-- Bar (Make sure it's above the line) -->
								<div class="bar bg-orange-700 w-full" style="height: {hours * 40}px;"></div>
							</div>
							<p class="day-label mt-2 text-sm">{['S', 'M', 'T', 'W', 'T', 'F', 'S'][index]}</p>
						</div>
					{/each}
				</div>

				<!-- Horizontal Line (Placed Behind Bars) -->
				<div
					class="absolute top-[10%] left-0 w-full border-t border-gray-500 opacity-50 transform -translate-y-1/2 z-0"
				></div>

				<!-- 300 Label at the Top -->
				<p class="absolute top-[3%] right-[-30px] text-gray-700 text-sm font-bold">150</p>
			</div>
		</div>
	{:else}
	<div class="mt-4">
		{#each userPost.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) as post (post.id)}
		  <!-- Post Container with white background -->
		  <div class="w-full">
			<UserPostsCard userPost={post} name={name}/>
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
		background-color: #f37003; /* Dark color */
		border-radius: 26px;
	}
</style>
