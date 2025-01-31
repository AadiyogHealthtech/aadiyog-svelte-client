<script lang="ts">
	import BottomTabBar from '$lib/components/TabBar/BottomTabBar.svelte';
	import Community from '$lib/icons/CommunityIcon.svelte';
	import Courses from '$lib/icons/CoursesIcon.svelte';
	import CoursePurchased from '$lib/icons/CoursePurchasedIcon.svelte';
	import SavedWorkouts from '$lib/icons/SavedWorkouts.svelte';
	import Phone from '$lib/icons/PhoneIcon.svelte';
	import Profile from '$lib/icons/ProfileIcon.svelte';
	import Settings from '$lib/icons/SettingsIcon.svelte';
	import RightArrow from '$lib/icons/RightArrowIcon.svelte';
	import Back from '$lib/icons/BackIcon.svelte';
	import Button from '$lib/components/Button/Button.svelte';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { getUserData } from '$lib/utils/api/services';
	import { getUserPost } from '$lib/utils/api/services';
	import UserWorkouts from '$lib/components/Cards/UserWorkouts.svelte';
	import ProgressCard from '$lib/components/Cards/ProgressCard.svelte';

	let id: number;
	let name: string = 'Loading...';
	let tabs = [
		{ name: 'Community', icon: Community },
		{ name: 'Workout', icon: Courses },
		{ name: 'Profile', icon: Profile }
	];
	let options = [
		{ name: 'Subscription Details', icon: CoursePurchased },
		{ name: 'Saved Workouts', icon: SavedWorkouts },
		{ name: 'Message Us', icon: Phone }
	];

	let profileImage = '/assets/images/Manu.webp';
	let activeTab = 1;
	let userPost = [];
	let errorMessage = '';
	let isLoading = true; // To show loading state

	onMount(async () => {
		const params = $page.params;
		id = params.id; // Get the ID from the route parameters
		const response = await getUserData(id); // Fetch and set the user's name
		name = response?.data?.attributes?.name || 'Unknown User';

		async function fetchUserPost() {
			try {
				// Fetch user post using the API function
				const data = await getUserPost(id);
				userPost = data ? (Array.isArray(data) ? data : [data]) : [];
				if (!userPost) {
					errorMessage = 'No post found for this user.';
				}
			} catch (error) {
				errorMessage = 'Failed to fetch the user post.';
			} finally {
				isLoading = false; // Stop the loading spinner
			}
		}

		// fetchUserPost();
	});

	function handelSettings() {
		goto('/user-profile/4');
	}

	function handelEditProfile() {
		goto('/user-profile/5');
	}

	function handleClickoption(option) {
		if (option.name === 'Message Us') {
			window.open('https://wa.me/918305909208', '_blank');
		} else {
			console.log(`Clicked: ${option.name}`);
		}
	}
	export let points = [
		{ x: 50, y: 200 },
		{ x: 100, y: 250 },
		{ x: 150, y: 180 },
		{ x: 200, y: 100 },
		{ x: 250, y: 130 }
	];
</script>

<div class="w-full px-8 pt-20 pb-4 flex flex-row items-center justify-center bg-white">
	<h1
  class="ml-2 text-neutral-grey-3 font-semibold"
  style="margin-top: 0; margin-bottom: 0; position: relative;"
>
  Profile
</h1>

	<!-- <div class="absolute top-13 right-8" on:click={handelSettings}>
		<Settings />
	</div> -->
</div>

<div class="h-full w-full flex flex-col bg-neutral-grey-11">
	<div class="flex flex-row bg-white w-full mt-2 px-8 py-4">
		<!-- Profile Image -->
		<img src={profileImage} alt="ProfileImage" class="w-24 h-24 rounded-full" />

		<!-- Profile Details -->
		<div class="flex flex-col ml-8">
			<!-- Name -->
			<h1 class="text-neutral-grey-4 font-normal mb-2 mt-2">{name}</h1>

			<!-- Buttons -->
			<div class="flex flex-row space-x-4">
				<button
					class="px-4 py-2 text-white rounded-lg"
					style="background-color: #F37003; hover:background-color: #F37003"
				>
					Follow
				</button>
				<button class="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400">
					Add Friend
				</button>
			</div>
			
		</div>
	</div>
	<hr class="border-t-0 border-[#D5D5D5]-300 my-1 w-full" />
	<div class="pb-20">
		<ProgressCard/>
	</div>
	
	<div class="fixed bottom-0 left-0 w-full bg-white">
		<BottomTabBar {tabs} id="One" activeTab={2} />
	</div>
</div>
