<script lang="ts">
	import RightArrow from '$lib/icons/RightArrowIcon.svelte';
	import { createEventDispatcher, onMount } from 'svelte';
	import Back from '$lib/icons/BackIcon.svelte';
	import Edit from '$lib/icons/EditIcon.svelte';
	import Modal from './Modal.svelte'; // Import the modal component
	import { goto } from '$app/navigation';
	import { getMedicalConditions, userDataStore } from '$lib/store/userDataStore';
	
	$: profileDetails = [
		{
			title: 'Name',
			description: $userDataStore?.name ?? 'Loading...'
		},
		{
			title: 'Mobile number',
			description: $userDataStore?.mobileNumber ?? 'Loading...'
		}
	];

	$: basicInformation = [
		{
			title: 'Gender',
			description: $userDataStore?.gender ?? 'Loading...'
		},
		{
			title: 'Age',
			description: $userDataStore?.age ?? 'Loading...'
		},
		{
			title: 'Height',
			description: $userDataStore?.height ?? 'Loading...'
		},
		{
			title: 'Weight',
			description: $userDataStore?.weight ?? 'Loading...'
		},
		{
			title: 'Sleep cycle',
			description: $userDataStore?.sleepTime ?? 'Loading...'
		},
		{
			title: 'Medical condition',
			description: getMedicalConditions($userDataStore?.medicalConditions) ?? 'Loading...'
		}
	];

	let profileImage = '/assets/images/Archana.png';
	let activeTab = 1;
	const dispatch = createEventDispatcher();

	let isModalOpen = false;
	let currentDetail = { title: '', description: '' };

	function handleClick(index: number) {
		activeTab = index;
		dispatch('click', activeTab);
	}

	function handelBack() {
		goto('/user-profile/1');
	}

	function openModal(detail) {
		if (detail.title === 'Weight') { // Only open modal for "Weight"
			currentDetail = { ...detail };
			isModalOpen = true;
		}
	}

	function closeModal() {
		isModalOpen = false;
	}

	function saveDetail(value) {
		currentDetail.description = value;
		isModalOpen = false;
	}
</script>

<div class="w-full px-8 pt-12 pb-4 flex flex-row items-center justify-center bg-white">
	<div class="absolute top-13 left-8" on:click={handelBack}>
		<Back />
	</div>
	<h1 class="ml-2 text-neutral-grey-3 font-semibold">Edit Profile</h1>
</div>

<div class="h-full w-full flex flex-col bg-neutral-grey-11">
	<div class="flex flex-col bg-white w-full mt-2 px-8 py-4">
		<div class="relative w-full flex items-center justify-center">
			<img src={profileImage} alt="ProfileImage" class="w-24 h-24 rounded-full" />
			<div class="absolute bottom-0 right-1/3">
				<Edit />
			</div>
		</div>

		{#each profileDetails as detail}
			<div class="relative flex flex-row items-center my-3">
				<div>
					<h2 class="text-neutral-grey-5 font-normal">{detail.title}</h2>
					<h2 class="text-neutral-grey-3 font-semibold">{detail.description}</h2>
				</div>
				<div class="absolute top-5 right-4" on:click={() => openModal(detail)}>
					<RightArrow />
				</div>
			</div>
		{/each}

		<h1 class="text-neutral-grey-3 font-semibold my-4">Basic information</h1>

		{#each basicInformation as detail}
			<div class="relative flex flex-row items-center my-3">
				<div>
					<h2 class="text-neutral-grey-5 font-normal">{detail.title}</h2>
					<h2 class="text-neutral-grey-3 font-semibold">{detail.description}</h2>
				</div>
				<div class="absolute top-5 right-4" on:click={() => openModal(detail)}>
					<RightArrow />
				</div>
			</div>
		{/each}
	</div>
</div>

<!-- Edit Modal -->
<Modal
	isOpen={isModalOpen}
	onClose={closeModal}
	title={`Edit ${currentDetail.title}`}
	value={currentDetail.description}
	onSave={saveDetail}
/>
