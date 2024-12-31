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
	export let points = [
		{ x: 50, y: 200 },
		{ x: 100, y: 250 },
		{ x: 150, y: 180 },
		{ x: 200, y: 100 },
		{ x: 250, y: 130 }
	];
</script>

<div class="w-full px-8 pt-20 pb-4 flex flex-row items-center justify-center bg-white">
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
		<svg width="390" height="508" viewBox="40 4 390 608" fill="none">
			<path d="M0 0H390V448H0V0Z" fill="white" />
			<path
				d="M390 448V449H391V448H390ZM0 448H-1V449H0V448ZM389 0V448H391V0H389ZM390 447H0V449H390V447ZM1 448V0H-1V448H1Z"
				fill="#DDE1E6"
			/>
			{#each points as point, i}
				<rect
					x={390 - point.x - 40 - i * 20}
					y={point.y}
					width="40"
					height={448 - point.y}
					fill="orange"
				/>
				<text x={390 - point.x - 30 - i * 20} y={point.y - 10} font-size="18" fill="black">
					{`${point.x}`}
				</text>
			{/each}
			<!-- X-axis -->
			<line x1="0" y1="448" x2="390" y2="448" stroke="black" />
			<!-- <text x="180" y="470" font-size="20" fill="black">X-axis</text> -->

			<!-- Y-axis -->
			<line x1="390" y1="0" x2="390" y2="448" stroke="black" />
			<text x="0" y="320" font-size="14" fill="gray" transform="rotate(-270, 10, 220)">Y-axis</text>
			<text x="420" y="448" font-size="20" fill="black" text-anchor="end">0</text>
			<text x="440" y="348" font-size="20" fill="black" text-anchor="end">100</text>
			<text x="440" y="248" font-size="20" fill="black" text-anchor="end">200</text>
			<text x="440" y="148" font-size="20" fill="black" text-anchor="end">300</text>
			<text x="440" y="48" font-size="20" fill="black" text-anchor="end">400</text>
		</svg>
		
	</div>
	<div class="h-full w-full flex flex-col bg-neutral-grey-11">
		<div class="flex flex-row bg-white w-full mt-2 px-0 py-4">
			<div class="flex flex-col bg-white w-full mt-2 px-8 py-4">
				<h2 class="text-neutral-grey-3 font-semibold">Your Calories</h2>
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
				<svg width="390" height="508" viewBox="40 4 390 608" fill="none">
					<path d="M0 0H390V448H0V0Z" fill="white" />
					<path
						d="M390 448V449H391V448H390ZM0 448H-1V449H0V448ZM389 0V448H391V0H389ZM390 447H0V449H390V447ZM1 448V0H-1V448H1Z"
						fill="#DDE1E6"
					/>
					{#each points as point, i}
						<rect
							x={390 - point.x - 40 - i * 20}
							y={point.y}
							width="40"
							height={448 - point.y}
							fill="orange"
						/>
						<text x={390 - point.x - 30 - i * 20} y={point.y - 10} font-size="18" fill="black">
							{`${point.x}`}
						</text>
					{/each}
					<!-- X-axis -->
					<line x1="0" y1="448" x2="390" y2="448" stroke="black" />
					<!-- <text x="180" y="470" font-size="20" fill="black">X-axis</text> -->
		
					<!-- Y-axis -->
					<line x1="390" y1="0" x2="390" y2="448" stroke="black" />
					<text x="0" y="320" font-size="14" fill="gray" transform="rotate(-270, 10, 220)">Y-axis</text>
					<text x="420" y="448" font-size="20" fill="black" text-anchor="end">0</text>
					<text x="440" y="348" font-size="20" fill="black" text-anchor="end">100</text>
					<text x="440" y="248" font-size="20" fill="black" text-anchor="end">200</text>
					<text x="440" y="148" font-size="20" fill="black" text-anchor="end">300</text>
					<text x="440" y="48" font-size="20" fill="black" text-anchor="end">400</text>
				</svg>
				
			</div>
		</div></div>
	
	

	<div class="fixed bottom-0 left-0 w-full bg-white">
		<BottomTabBar {tabs} id="One" activeTab={2} />
	</div>
</div>
