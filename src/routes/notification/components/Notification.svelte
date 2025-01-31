<script lang="ts">
	import { onMount } from 'svelte';
	import NotificationCard from '$lib/components/Cards/NotificationCard.svelte';
	import BottomTabBar from '$lib/components/TabBar/BottomTabBar.svelte';
	import Community from '$lib/icons/CommunityIcon.svelte';
	import Courses from '$lib/icons/CoursesIcon.svelte';
	import MainLogo from '$lib/icons/MainLogoIcon.svelte';
	import Logo from '$lib/Images/aadiyog-hindi.png';
	import Profile from '$lib/icons/ProfileIcon.svelte';
	import { goto } from '$app/navigation';
	import { createEventDispatcher } from 'svelte';
	import bell from '$lib/images/bell.png';
	import search from '$lib/images/search.png';
	// Notifications Array
	const notifications = [
	  {
		id: 1,
		name: "John Doe",
		message: "You have received a new message.",
		createdAt: "2025-01-11T10:30:00Z",
	  },
	  {
		id: 2,
		name: "System Admin",
		message: "Your system update has been completed.",
		createdAt: "2025-01-10T14:00:00Z",
	  },
	  {
		id: 3,
		name: "Jane Smith",
		message: "Don't forget to attend the meeting at 3 PM.",
		createdAt: "2025-01-11T08:00:00Z",
	  },
	];
  
	// Tab bar items
	let tabs = [
	  { name: 'Community', icon: Community },
	  { name: 'Workout', icon: Courses },
	  { name: 'Profile', icon: Profile }
	];
  
	let activeTab = 0;
	const dispatch = createEventDispatcher();
  
	function handleClick(event: CustomEvent<number>) {
	  activeTab = event.detail;
	  dispatch('tabClick', activeTab);
	}
  </script>
  
  <div class="h-full pt-4 pb-24 flex flex-col items-start w-full overflow-x-hidden">
	<!-- Header -->
	<div class="w-full px-8 flex flex-row items-center justify-between">
	  <!-- Logo and Title Section -->
	  <div class="flex items-center">
		<MainLogo width={32} height={32} />
		<h1 class="ml-2">Aadiyog</h1>
	  </div>
  
	
	  <div class="flex space-x-4 items-center">
			<!-- Search Icon -->
		<button class="bg-transparent p-0 rounded-full">
			<img src={search}>
		</button>
		<!-- Notification Icon -->
		<a href="/notification">
			<button class="bg-transparent p-2 rounded-full">
				<img src="{bell}" alt="Notification Bell">
			</button>
		</a>
		
		
	</div>
	</div>
  
	<!-- Content Section -->
	<div class="px-8 mt-5 font-bold text-2xl">
	  <h2>Today</h2>
	</div>
  
	<!-- Notifications -->
	{#each notifications as notification}
	  <div class="px-8">
		<NotificationCard {notification} />
	  </div>
	{/each}
  
	<!-- Bottom Tab Bar -->
	<div class="fixed bottom-0 left-0 w-full bg-white">
	  <BottomTabBar {tabs} id="One" {activeTab} on:click={handleClick} />
	</div>
  </div>
  
  <style>
	/* Add any specific styles here */
  </style>
  