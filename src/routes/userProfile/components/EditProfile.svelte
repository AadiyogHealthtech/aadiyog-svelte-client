<script lang="ts">
	import RightArrow from '$lib/icons/RightArrow.svelte';
	import { createEventDispatcher } from 'svelte';
	import Back from '$lib/icons/Back.svelte';
	import User from '$lib/icons/User.svelte';
	import Star from '$lib/icons/Star.svelte';
	import Flag from '$lib/icons/Flag.svelte';
	import File from '$lib/icons/File.svelte';
	import Lock from '$lib/icons/Lock.svelte';
	import Edit from '$lib/icons/Edit.svelte';

	let profileDetails = [
		{
			title: 'Name',
			description: 'Archana Pawar'
		},
		{
			title: 'Mobile number',
			description: '+91 8184480930'
		}
	];
	let basicInformation = [
		{
			title: 'Gender',
			description: 'Female'
		},
		{
			title: 'Age',
			description: '43'
		},
		{
			title: 'Height',
			description: '160 cm'
		},
		{
			title: 'Weight',
			description: '60 kg'
		},
		{
			title: 'Sleep cycle',
			description: '7 hrs'
		},
		{
			title: 'Medical condition',
			description: 'Thyroid'
		}
	];

	let profileImage = '/assets/images/Archana.png';

	let activeTab = 1;
	const dispatch = createEventDispatcher();
	function handleClick(index: number) {
		activeTab = index;
		dispatch('click', activeTab);
	}
</script>

<div class="w-full px-8 pt-12 pb-4 flex flex-row items-center justify-center bg-white">
	<div class="absolute top-13 left-8">
		<Back />
	</div>
	<h1 class="ml-2 text-neutral-grey-3 font-semibold">Edit Profile</h1>
</div>

<div class="h-full w-full flex flex-col bg-neutral-grey-11">
	<div class="flex flex-col bg-white w-full mt-4 px-8 py-4">
		<div class="relative w-full flex items-center justify-center">
			<img src={profileImage} alt="ProfileImage" class="w-24 h-24 rounded-full" />
			<div class="absolute bottom-0 right-1/3">
				<Edit />
			</div>
		</div>

		{#each profileDetails as detail, index}
			<div class="relative flex flex-row items-center my-3">
				<div>
					<h2 class="text-neutral-grey-5 font-normal">{detail.title}</h2>
					<h2 class="text-neutral-grey-3 font-semibold">{detail.description}</h2>
				</div>
				<div class="absolute top-5 right-4">
					<RightArrow />
				</div>
			</div>
		{/each}

		<h1 class="text-neutral-grey-3 font-semibold my-4">Basic information</h1>

		{#each basicInformation as detail, index}
			<div class="relative flex flex-row items-center my-3">
				<div>
					<h2 class="text-neutral-grey-5 font-normal">{detail.title}</h2>
					<h2 class="text-neutral-grey-3 font-semibold">{detail.description}</h2>
				</div>
				<div class="absolute top-5 right-4">
					<RightArrow />
				</div>
			</div>
		{/each}
	</div>
</div>
