<script lang="ts">
	import RightArrow from '$lib/icons/RightArrowIcon.svelte';
	import { createEventDispatcher } from 'svelte';
	import { goto } from '$app/navigation';
	import Back from '$lib/icons/BackIcon.svelte';
	import User from '$lib/icons/UserIcon.svelte';
	import Star from '$lib/icons/StarIcon.svelte';
	import Flag from '$lib/icons/FlagIcon.svelte';
	import File from '$lib/icons/FileIcon.svelte';
	import Lock from '$lib/icons/LockIcon.svelte';
	import LogOut from '$lib/icons/LogOutIcon.svelte';
	import { authStore } from '$lib/store/authStore';
	import { userDataStore } from '$lib/store/userDataStore';
	import DeleteIcon from '$lib/icons/DeleteIcon.svelte';
	const logoutHandler = () => {
		localStorage.removeItem('token');
		localStorage.removeItem('user');
		localStorage.removeItem('userId');
		authStore.set(null);
		userDataStore.set(null);
		alert('user logged out');
		goto('/');
	};
	let allOptions = [
		{
			name: 'My account',
			options: [{ name: 'Edit Profile', icon: User }]
		},
		{
			name: 'Feedback',
			options: [
				{ name: 'Rate the app', icon: Star },
				{ name: 'Report a problem', icon: Flag }
			]
		},
		{
			name: 'Aadiyog',
			options: [
				{ name: 'Terms and Conditions', icon: File },
				{ name: 'Privacy Policy ', icon: Lock }
			]
		}
	];

	let activeTab = 1;
	const dispatch = createEventDispatcher();
	function handleClick(index: number) {
		activeTab = index;
		dispatch('click', activeTab);
	}
	function handelBack() {
		goto('/user-profile/1');
	}
	function deleteHandler() {
		goto('/user-profile/6');
	}
</script>

<!-- <div class="w-full px-8 pt-12 pb-4 flex flex-row items-center justify-center bg-white"> -->
	<div class="w-full px-8 pt-6 pb-4 flex flex-row items-center justify-center bg-white">
	<div class="absolute top-13 left-8" on:click={handelBack}>
		<Back />
	</div>
	<h1 class="ml-2 text-neutral-grey-3 font-semibold">Settings</h1>
</div>

<div class="h-full w-full flex flex-col bg-neutral-grey-11">
	{#each allOptions as options, index}
		<div class="flex flex-col bg-white w-full mt-4 px-8 py-4">
			<h1 class="text-neutral-grey-4 font-normal mb-2">{options.name}</h1>
			{#each options.options as option, index}
				<div class="relative flex flex-row items-center my-3">
					<svelte:component this={option.icon} stroke="#333333" />
					<h2 class="text-neutral-grey-3 font-semibold ml-4">{option.name}</h2>
					<div class="absolute top-1 right-4">
						<RightArrow />
					</div>
				</div>
			{/each}
		</div>
	{/each}
	<div class="flex flex-row bg-white items-center w-full mt-4 px-8 py-4">
		<LogOut />
		<h2 class="text-neutral-grey-3 font-semibold ml-4" on:click={logoutHandler}>Sign out</h2>
	</div>
	<div class="flex flex-row bg-white items-center w-full mt-4 px-8 py-4 " style="background-color: #852221;">
		<DeleteIcon />
		<h2 class="text-white font-semibold ml-4" on:click={deleteHandler}>Delete Account</h2>
	</div>
</div>
