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
	import { createEventDispatcher, onMount, afterUpdate } from 'svelte';
	import Button from '$lib/components/Button/Button.svelte';
	import { goto } from '$app/navigation';
	import { getUserData, getUserPosts } from '$lib/utils/api/services';
	import { userDataStore } from '$lib/store/userDataStore';
	import { authStore } from '$lib/store/authStore';
	import CommunityCard from '$lib/components/Cards/CommunityCard.svelte';
	import UserWorkouts from '$lib/components/Cards/UserWorkouts.svelte';
	import ProgressCard from '$lib/components/Cards/ProgressCard.svelte';
	import { browser } from '$app/environment';

	let userId = null;
	const id = browser ? localStorage.getItem('userId') : null;
	let userPost = [];
	let errorMessage = '';
	let isLoading = true; // Loading state
	
	// Default profile image and flag for first load
	let defaultProfileImage = '/assets/images/Manu.webp';
	let isFirstLoad = true;

	onMount(async () => {
		if (!$authStore) {
			goto('/user-profile/2');
			return;
		}

		userId = localStorage.getItem('userId');
		if (!userId) {
			errorMessage = 'User ID not found in local storage.';
			isLoading = false;
			return;
		}

		try {
			// Check if profile image is already in store
			if (!$userDataStore?.image?.data?.attributes?.url) {
				// Fetch user data to get the profile image
				const userResponse = await getUserData(userId);
				
				// Update userDataStore with image if available
				if (userResponse?.data?.attributes?.image?.data?.attributes?.url) {
					userDataStore.update(userData => ({
						...userData,
						image: userResponse.data.attributes.image
					}));
				}
			}

			// Fetch user posts
			const postData = await getUserPosts(userId);
			userPost = postData ? (Array.isArray(postData) ? postData : [postData]) : [];
			if (!userPost.length) {
				errorMessage = 'No posts found for this user.';
			}
		} catch (error) {
			console.error("Error fetching data:", error);
			errorMessage = 'Failed to fetch user data or posts.';
		} finally {
			isLoading = false;
			isFirstLoad = false;
		}
	});

	// Force UI update after component mounts to prevent black bar issue
	afterUpdate(() => {
		// Trigger layout recalculation
		if (browser && document.body) {
			document.body.style.backgroundColor = document.body.style.backgroundColor;
		}
	});

	// Reactive statement to get profile image
	$: profileImage = $userDataStore?.image?.data?.attributes?.url || defaultProfileImage;

	let tabs = [
    { name: 'Community', icon: Community },
    { name: 'Workout', icon: Courses },
    { name: 'Profile', icon: Profile },
	];

	let options = [
    { name: 'Subscription Details', icon: CoursePurchased },
    { name: 'Saved Workouts', icon: SavedWorkouts },
    { name: 'Message Us', icon: Phone }
	];

	let activeTab = 1;
	const dispatch = createEventDispatcher();

	function handleClick(index: number) {
		activeTab = index;
		dispatch('click', activeTab);
	}

	function handelSettings() {
		goto('/user-profile/4');
	}

	function handelEditProfile() {
		goto('/user-profile/5');
	}
	function handelDeleteAccount() {
		goto('/user-profile/6');
	}

	function handleClickoption(option) {
		if (option.name === 'Message Us') {
			window.open('https://wa.me/918305909208', '_blank');
		} else if (option.name === 'Saved Workouts') {
			window.location.href = '/saved-courses';
		} else {
			console.log(`Clicked: ${option.name}`);
		}
	}
</script>

<!-- Main Content Container - Removed the top HR that may cause the black bar -->
<div class="min-h-screen w-full flex flex-col bg-white">
	<!-- Scrollable Content with Extra Bottom Padding -->
	<div class="flex-1 bg-white overflow-auto pb-24">
		<div class="w-full px-8 pt-6 pb-6 flex items-center justify-center bg-white relative">
			<h1 class="text-neutral-grey-3 font-semibold absolute left-1/2 transform -translate-x-1/2">
				Profile
			</h1>
			<div class="absolute right-8" on:click={handelSettings}>
				<Settings />
			</div>
		</div>

		<hr class="border-t-8 border-[#D5D5D5]-300 w-full" />
		<!-- Profile Section -->
		<div class="flex flex-row bg-white w-full mt-2 px-8 py-4">
			{#if isLoading}
				<div class="w-24 h-24 rounded-full bg-gray-300 animate-pulse"></div>
			{:else}
				<img 
					src={profileImage} 
					alt="ProfileImage" 
					class="w-24 h-24 rounded-full object-cover" 
				/>
			{/if}
			<div class="ml-4">
				<h1 class="text-neutral-grey-4 font-normal mb-2">
					{$userDataStore?.name || 'Loading...'}
				</h1>
				<Button id="EditProfile" variant="ghost" on:click={handelEditProfile}>
					Edit Profile
				</Button>
			</div>
		</div>

		<hr class="border-t-8 border-[#D5D5D5]-300 my-3 w-full" />

		<!-- Options Section -->
		<div class="flex flex-col bg-white w-full mt-2 px-8 py-4">
			{#each options as option, index}
				<div
					class="relative flex flex-row items-center my-3 cursor-pointer"
					on:click={() => handleClickoption(option)}
				>
					<svelte:component this={option.icon} />
					<h2 class="text-neutral-grey-3 font-semibold ml-4">{option.name}</h2>
					<div class="absolute top-1 right-4">
						<RightArrow />
					</div>
				</div>
			{/each}
		</div>
		<hr class="border-t-8 border-[#D5D5D5]-300 my-3 w-full" />
		<ProgressCard userId={id} name={$userDataStore?.name}/>
	</div>
</div>

<!-- Fixed Bottom Navigation -->
<div class="fixed bottom-0 left-0 w-full bg-white shadow-md">
	<BottomTabBar {tabs} id="One" activeTab={2} />
</div>