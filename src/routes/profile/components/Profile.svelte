<script lang="ts">
	// Force client-side rendering
	export const ssr = false;

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
	import { getToken } from '$lib/store/authStore';

	// Log immediately to confirm script execution
	// console.log("Profile.svelte script loaded at:", new Date().toISOString());

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

	let profileImage = '/mainLogo.png'; // Default profile image
	let activeTab = 1;
	let userPost = [];
	let errorMessage = '';
	let isLoading = true;
	const userid = $page.params.id;
	let token = getToken();
	let isFollowed = false;

	// Log params immediately
	// console.log("Route param userid:", userid);

	// Define the data-fetching logic as a reusable function
	async function fetchUserData() {
		try {
			id = parseInt(userid || localStorage.getItem('userId') || '0');
			// console.log("Attempting to fetch user data for ID:", id, "at:", new Date().toISOString());

			if (!id || id === 0) {
				throw new Error('No valid user ID found');
			}

			const response = await getUserData(id);
			// console.log("Raw API Response:", response);

			if (response?.data?.attributes?.name) {
				name = response.data.attributes.name;
				// console.log("Extracted Name:", name);
			} else {
				// console.log("No name found in response");
			}

			isFollowed = response.data.attributes.followers?.data?.some(user => user.id.toString() === localStorage.getItem('userId')) || false;
			// console.log("isFollowed:", isFollowed);

			const imageData = response?.data?.attributes?.image?.data?.attributes;
			if (imageData && imageData.url) {
				profileImage = imageData.url;
				// console.log("Image URL:", profileImage);
			} else {
				// console.log("No image found in response, using default");
			}
		} catch (error) {
			console.error("Profile Page Error:", error);
			errorMessage = error instanceof Error ? error.message : 'Failed to load user profile.';
			name = 'Error Loading Profile';
		} finally {
			isLoading = false;
		}
	}

	// Run on every mount
	onMount(() => {
		// console.log("onMount triggered at:", new Date().toISOString());
		fetchUserData();
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
			// console.log(`Clicked: ${option.name}`);
		}
	}

	async function handleFollowClick() {
		const toBeFollowedId = id.toString(); // Convert to string for Strapi
		const userId = localStorage.getItem('userId');

		if (!userId || !toBeFollowedId) {
			console.error('User ID or To Be Followed ID is missing');
			errorMessage = 'User ID or target user ID is missing';
			return;
		}

		if (userId === toBeFollowedId) {
			console.error('Users cannot follow themselves');
			errorMessage = 'You cannot follow yourself';
			return;
		}

		// console.log(`userId -> ${userId}, toBeFollowedId -> ${toBeFollowedId}, isFollowed -> ${isFollowed}`);

		try {
			if (isFollowed) {
				// Unfollow: Remove toBeFollowedId from user's following and userId from target's followers
				const updateCurrentUserResponse = await fetch(
					`https://v2.app.aadiyog.in/api/aadiyog-users/${userId}`,
					{
						method: 'PUT',
						headers: {
							Authorization: `Bearer ${token}`,
							'Content-Type': 'application/json',
						},
						body: JSON.stringify({
							data: {
								following: {
									disconnect: [toBeFollowedId],
								},
							},
						}),
					}
				);

				if (!updateCurrentUserResponse.ok) {
					const errorData = await updateCurrentUserResponse.json();
					console.error('Unfollow current user error:', errorData);
					throw new Error('Failed to update current user following list');
				}

				const updateTargetUserResponse = await fetch(
					`https://v2.app.aadiyog.in/api/aadiyog-users/${toBeFollowedId}`,
					{
						method: 'PUT',
						headers: {
							Authorization: `Bearer ${token}`,
							'Content-Type': 'application/json',
						},
						body: JSON.stringify({
							data: {
								followers: {
									disconnect: [userId],
								},
							},
						}),
					}
				);

				if (!updateTargetUserResponse.ok) {
					const errorData = await updateTargetUserResponse.json();
					console.error('Unfollow target user error:', errorData);
					throw new Error('Failed to update target user followers list');
				}

				// console.log(`User ${userId} successfully unfollowed user ${toBeFollowedId}`);
				isFollowed = false;
			} else {
				// Follow: Add toBeFollowedId to user's following and userId to target's followers
				const currentUserResponse = await fetch(
					`https://v2.app.aadiyog.in/api/aadiyog-users/${userId}?populate=following`,
					{
						method: 'GET',
						headers: {
							Authorization: `Bearer ${token}`,
							'Content-Type': 'application/json',
						},
					}
				);

				if (!currentUserResponse.ok) {
					throw new Error('Failed to fetch current user data');
				}

				const currentUserData = await currentUserResponse.json();
				const currentFollowing =
					currentUserData.data.attributes.following?.data.map((user) => user.id.toString()) || [];

				if (currentFollowing.includes(toBeFollowedId)) {
					// console.log('User is already following this user');
					isFollowed = true;
					return;
				}

				const targetUserResponse = await fetch(
					`https://v2.app.aadiyog.in/api/aadiyog-users/${toBeFollowedId}?populate=followers`,
					{
						method: 'GET',
						headers: {
							Authorization: `Bearer ${token}`,
							'Content-Type': 'application/json',
						},
					}
				);

				if (!targetUserResponse.ok) {
					throw new Error('Failed to fetch target user data');
				}

				const targetUserData = await targetUserResponse.json();
				const currentFollowers =
					targetUserData.data.attributes.followers?.data.map((user) => user.id.toString()) || [];

				const updateCurrentUserResponse = await fetch(
					`https://v2.app.aadiyog.in/api/aadiyog-users/${userId}`,
					{
						method: 'PUT',
						headers: {
							Authorization: `Bearer ${token}`,
							'Content-Type': 'application/json',
						},
						body: JSON.stringify({
							data: {
								following: {
									connect: [toBeFollowedId],
								},
							},
						}),
					}
				);

				if (!updateCurrentUserResponse.ok) {
					const errorData = await updateCurrentUserResponse.json();
					console.error('Follow current user error:', errorData);
					throw new Error('Failed to update current user following list');
				}

				const updateTargetUserResponse = await fetch(
					`https://v2.app.aadiyog.in/api/aadiyog-users/${toBeFollowedId}`,
					{
						method: 'PUT',
						headers: {
							Authorization: `Bearer ${token}`,
							'Content-Type': 'application/json',
						},
						body: JSON.stringify({
							data: {
								followers: {
									connect: [userId],
								},
							},
						}),
					}
				);

				if (!updateTargetUserResponse.ok) {
					const errorData = await updateTargetUserResponse.json();
					console.error('Follow target user error:', errorData);
					throw new Error('Failed to update target user followers list');
				}

				// console.log(`User ${userId} successfully followed user ${toBeFollowedId}`);
				isFollowed = true;
			}
		} catch (error) {
			console.error('Error in handleFollowClick:', error instanceof Error ? error.message : error);
			errorMessage = isFollowed
				? 'Failed to unfollow user. Please try again.'
				: 'Failed to follow user. Please try again.';
		}
	}

	export const points = [
		{ x: 50, y: 200 },
		{ x: 100, y: 250 },
		{ x: 150, y: 180 },
		{ x: 200, y: 100 },
		{ x: 250, y: 130 }
	];
</script>

<hr class="border-t-8 border-[#D5D5D5]-300 my-3 w-full" />
<div class="min-h-screen w-full flex flex-col bg-white">
	<div class="bg-white overflow-auto pb-24">
		<div class="w-full px-8 pt-6 pb-6 flex items-center justify-center bg-white relative">
			<h1 class="text-neutral-grey-3 font-semibold absolute left-1/2 transform -translate-x-1/2">
				Profile
			</h1>
		</div>

		<hr class="border-t-8 border-[#D5D5D5]-300 my-3 w-full" />
		<div class="flex flex-row bg-white w-full mt-2 px-8 py-4">
			<img
				src={profileImage}
				alt="ProfileImage"
				class="w-24 h-24 rounded-full object-cover"
			/>
			<div class="ml-4">
				<h1 class="text-neutral-grey-4 font-normal ml-2 mb-2">{name || 'Loading...'}</h1>
				<div class="flex flex-row space-x-4">
					<button
						class="px-2 py-2 text-white rounded-lg transition-colors duration-200"
						class:bg-orange-500={!isFollowed}
						class:bg-gray-500={isFollowed}
						class:hover:bg-orange-600={!isFollowed}
						class:hover:bg-gray-600={isFollowed}
						class:opacity-70={isFollowed}
						on:click={handleFollowClick}
					>
						{isFollowed ? 'Following' : 'Follow'}
					</button>
					<button class="px-2 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400">
						Add Friend
					</button>
				</div>
			</div>
		</div>

		{#if errorMessage}
			<div class="text-red-500 p-4 text-center">
				{errorMessage}
			</div>
		{/if}

		<hr class="border-t-8 border-[#D5D5D5]-300 my-3 w-full" />
		<ProgressCard userId={userid} name={name} />
	</div>
</div>

<div class="fixed bottom-0 left-0 w-full bg-white shadow-md">
	<BottomTabBar {tabs} id="One" activeTab={2} />
</div>

<style>
	.bg-orange-500 {
		background-color: #F37003;
	}
	.bg-gray-500 {
		background-color: #6B7280;
	}
	.hover\:bg-orange-600:hover {
		background-color: #E55E00;
	}
	.hover\:bg-gray-600:hover {
		background-color: #4B5563; 
	}
	.opacity-70 {
		opacity: 0.7;
	}
</style>