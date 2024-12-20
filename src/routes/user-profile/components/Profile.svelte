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
	import { createEventDispatcher, onMount } from 'svelte';
	import Button from '$lib/components/Button/Button.svelte';
	import Back from '$lib/icons/BackIcon.svelte';
	import { goto } from '$app/navigation';
	import { getUserData } from '$lib/utils/api/services';
	import { userDataStore } from '$lib/store/userDataStore';
	import { authStore } from '$lib/store/authStore';
	onMount(() => {
		if (!$authStore) {
			goto('/user-profile/2');
		}
	});
	let tabs = [
		{ name: 'Community', icon: Community },
		{ name: 'Workout', icon: Courses },
		{ name: 'Profile', icon: Profile }
	];
	let options = [
		{ name: 'Subscription Details', icon: CoursePurchased },
		{ name: 'Saved Workouts', icon: SavedWorkouts },
		{ name: 'Call Professional', icon: Phone }
	];

	// let profileImage = '/assets/images/Archana.png';
	let profileImage = '/assets/images/Manu.webp';

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
</script>

<div class="w-full px-8 pt-6 pb-4 flex flex-row items-center justify-center bg-white">
	<h1 class="ml-2 text-neutral-grey-3 font-semibold">Profile</h1>
	<div class="absolute top-13 right-8" on:click={handelSettings}>
		<Settings />
	</div>
</div>

<div class="h-full w-full flex flex-col bg-neutral-grey-11">
	<div class="flex flex-row bg-white w-full mt-2 px-8 py-4">
		<img src={profileImage} alt="ProfileImage" class="w-24 h-24 rounded-full" />
		<div class="ml-4">
			<h1 class="text-neutral-grey-4 font-normal mb-2">{$userDataStore?.name || 'Loading.'}</h1>
			<Button id="EditProfile" variant="ghost" on:click={handelEditProfile}>Edit Profile</Button>
		</div>
	</div>

	<div class="flex flex-col bg-white w-full mt-2 px-8 py-4">
		{#each options as option, index}
			<div class="relative flex flex-row items-center my-3">
				<svelte:component this={option.icon} />
				<h2 class="text-neutral-grey-3 font-semibold ml-4">{option.name}</h2>
				<div class="absolute top-1 right-4">
					<RightArrow />
				</div>
			</div>
		{/each}
	</div>

	<div class="flex flex-col bg-white w-full mt-2 px-8 py-4">
		<h2 class="text-neutral-grey-3 font-semibold">Your Progress</h2>
		<div class="flex flex-row items-center mt-8">
			<Back color="#F37003" />
			<h2 class="text-neutral-grey-3 font-semibold mx-4">Last 7 days</h2>
			<RightArrow />
		</div>
		<div class="flex flex-row mt-4">
			<div>
				<h2 class="text-neutral-grey-3 font-bold">800</h2>
				<h2 class="text-neutral-grey-5 font-normal">Weekly Cal</h2>
			</div>
			<div class="ml-8">
				<h2 class="text-neutral-grey-3 font-bold">114</h2>
				<h2 class="text-neutral-grey-5 font-normal">Average Cal Per Day</h2>
			</div>
		</div>
	</div>

	<div class="fixed bottom-0 left-0 w-full bg-white">
		<BottomTabBar {tabs} id="One" activeTab={2} />
	</div>
</div>
