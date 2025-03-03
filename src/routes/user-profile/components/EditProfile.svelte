
   <script lang="ts">
	import RightArrow from '$lib/icons/RightArrowIcon.svelte';
	import { createEventDispatcher } from 'svelte';
	import Back from '$lib/icons/BackIcon.svelte';
	import Edit from '$lib/icons/EditIcon.svelte';
	import Modal from './Modal.svelte';
	import { goto } from '$app/navigation';
	import { getMedicalConditions, userDataStore } from '$lib/store/userDataStore';
  
	// Reactive variables
	// let profileImage = '/assets/images/Archana.png'; // Default profile image
	let profileImage = '/assets/images/Manu.webp';
	let activeTab = 1;
	const dispatch = createEventDispatcher();
  
	let isModalOpen = false;
	let currentDetail = { title: '', description: '' };
  
	let isProfileImageModalOpen = false;
  
	// Ensure userDataStore is loaded before referencing it
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
		title: 'Weight',
		description: $userDataStore?.weight ?? 'Loading...'
	  },
	  {
		title: 'Sleep cycle',
		description: $userDataStore?.sleepTime ?? 'Loading...'
	  },
	  {
		title: 'Gender',
		description: $userDataStore?.gender ?? 'Loading...'
	  },
	//   {
	// 	title: 'Age',
	// 	description: $userDataStore?.age ?? 'Loading...'
	//   },
	  {
		title: 'Height',
		description: $userDataStore?.height ?? 'Loading...'
	  },
	  
	  {
		title: 'Medical condition',
		description: getMedicalConditions($userDataStore?.medicalConditions) ?? 'Loading...'
	  }
	];

	console.log("userDataStore:", $userDataStore);
  
	function handelBack() {
	  goto('/user-profile/1');
	}
  
	function openModal(detail) {
	  if (detail.title === 'Weight') { 
		currentDetail = { 
		  title: `Edit Weight`, 
		  description: $userDataStore?.weight ?? 'Loading...' 
		};
		isModalOpen = true;
	  }
	}
  
	function closeModal() {
	  isModalOpen = false;
	}
  
	function saveDetail(value) {
	  userDataStore.update((userData) => {
		if (currentDetail.title === 'Edit Weight') {
		  userData.weight = value;
		}
		return userData;
	  });
  
	  currentDetail.description = value;
	  isModalOpen = false;
	}
  
	// Handle image upload
	function handleProfileImageUpload(event) {
	  const file = event.target.files[0];
	  if (file) {
		const reader = new FileReader();
		reader.onloadend = () => {
		  profileImage = reader.result as string;  // Set the uploaded image to profileImage
		};
		reader.readAsDataURL(file);
	  }
	  isProfileImageModalOpen = false; // Close the modal after the upload
	}
  
	function openProfileImageModal() {
	  isProfileImageModalOpen = true; // Open the profile image upload modal
	}
  
	function closeProfileImageModal() {
	  isProfileImageModalOpen = false; // Close the modal
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
		<img src={profileImage} alt="ProfileImage" class="w-24 h-24 rounded-full cursor-pointer" on:click={openProfileImageModal} />
		<div class="absolute bottom-0 left-1/2 transform -translate-x-1/8">
			<Edit />
		</div>
	  </div>
  
	  {#each profileDetails as detail}
		<div class="relative flex flex-row items-center my-3">
		  <div>
			<h2 class="text-neutral-grey-5 font-normal">{detail.title}</h2>
			<h2 class="text-neutral-grey-3 font-semibold">{detail.description}</h2>
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
		  {#if detail.title === 'Weight'}
			<div class="absolute top-5 right-4" on:click={() => openModal(detail)}>
			  <RightArrow />
			</div>
		  {/if}
		</div>
	  {/each}
	</div>
  </div>
  
  <!-- Edit Modal -->
  <Modal
	isOpen={isModalOpen}
	onClose={closeModal}
	title={currentDetail.title}
	value={currentDetail.description}
	onSave={saveDetail}
  />
  
  <!-- Profile Image Upload Modal -->
  {#if isProfileImageModalOpen}
	<div class="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50">
	  <div class="bg-white p-6 rounded shadow-lg w-96">
		<h2 class="text-lg font-semibold mb-4">Upload Profile Image</h2>
		<input type="file" accept="image/*" on:change={handleProfileImageUpload} class="mb-4" />
		<div class="flex justify-end space-x-2">
		  <button on:click={closeProfileImageModal} class="px-4 py-2 bg-gray-300 rounded">Cancel</button>
		</div>
	  </div>
	</div>
  {/if}
  