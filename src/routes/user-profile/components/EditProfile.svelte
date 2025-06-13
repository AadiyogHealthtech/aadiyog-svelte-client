<script lang="ts">
	import RightArrow from '$lib/icons/RightArrowIcon.svelte';
	import { createEventDispatcher, onMount } from 'svelte';
	import Back from '$lib/icons/BackIcon.svelte';
	import Edit from '$lib/icons/EditIcon.svelte';
	import Modal from './Modal.svelte';
	import { goto } from '$app/navigation';
	import { getMedicalConditions, userDataStore } from '$lib/store/userDataStore';
	import { updateProfileImage } from '$lib/utils/api/services';
	import Cropper from 'cropperjs'; // Import Cropper.js
	import 'cropperjs/dist/cropper.css'; // Import Cropper.js styles

	// Reactive variables
	let profileImage = $userDataStore?.image?.data?.attributes?.url || '/assets/images/Manu.webp'; // Use store image if available
	let activeTab = 1;
	const dispatch = createEventDispatcher();

	let isModalOpen = false;
	let currentDetail = { title: '', description: '' };
	let isProfileImageModalOpen = false;
	let isLoading = false;
	let errorMessage = '';

	// Cropper variables
	let imageElement: HTMLImageElement;
	let cropper: Cropper;
	let croppedBlob: Blob | null = null;

	// Profile details
	$: profileDetails = [
		{ title: 'Name', description: $userDataStore?.name ?? 'Loading...' },
		{ title: 'Mobile number', description: $userDataStore?.mobileNumber ?? 'Loading...' }
	];

	$: basicInformation = [
		{ title: 'Weight', description: $userDataStore?.weight ?? 'Loading...' },
		{ title: 'Sleep cycle', description: $userDataStore?.sleepTime ?? 'Loading...' },
		{ title: 'Gender', description: $userDataStore?.gender ?? 'Loading...' },
		{ title: 'Height', description: $userDataStore?.height ?? 'Loading...' },
		{ title: 'Medical condition', description: getMedicalConditions($userDataStore?.medicalConditions) ?? 'Loading...' }
	];

	// Initialize profile image on mount
	onMount(() => {
		if ($userDataStore?.image?.data?.attributes?.url) {
			profileImage = $userDataStore.image.data.attributes.url;
		}
	});

	function handelBack() {
		goto('/user-profile/1');
	}

	function openModal(detail) {
		if (detail.title === 'Weight') {
			currentDetail = { title: `Edit Weight`, description: $userDataStore?.weight ?? 'Loading...' };
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

	// Initialize Cropper.js when an image is selected
	function handleImageSelect(event) {
		const file = event.target.files[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (e) => {
			if (imageElement && cropper) {
				cropper.destroy(); // Destroy existing cropper instance
			}
			imageElement.src = e.target.result as string;
			cropper = new Cropper(imageElement, {
				aspectRatio: 1, // Square crop
				viewMode: 1,
				crop: () => {
					// Optional: Handle crop event if needed
				}
			});
		};
		reader.readAsDataURL(file);
	}

	// Handle profile image upload with cropping
	async function handleProfileImageUpload() {
		if (!croppedBlob && !imageElement.src) {
			errorMessage = 'Please select and crop an image first.';
			return;
		}

		const userId = $userDataStore?.id || localStorage.getItem('userId');
		if (!userId) {
			errorMessage = 'User ID not found. Please log in again.';
			return;
		}

		isLoading = true;
		errorMessage = '';

		try {
			// Get cropped image as Blob if cropped, otherwise use original file
			const blob = croppedBlob || (await new Promise<Blob>((resolve) =>
				cropper.getCroppedCanvas().toBlob((b) => resolve(b), 'image/jpeg')
			));

			// Upload image
			const formData = new FormData();
			formData.append('files', blob, 'profile.jpg');
			formData.append('ref', 'plugin::users-permissions.user');
			formData.append('refId', userId);
			formData.append('field', 'image');

			const uploadResponse = await fetch('https://v2.app.aadiyog.in/api/upload', {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${localStorage.getItem('authToken')}`
				},
				body: formData
			});

			if (!uploadResponse.ok) {
				throw new Error('Upload failed');
			}

			const uploadedImages = await uploadResponse.json();
			const uploadedImage = uploadedImages[0];
			const imageId = uploadedImage.id;
			const imageUrl = uploadedImage.url;

			// Update user profile
			const updateResponse = await fetch(`https://v2.app.aadiyog.in/api/aadiyog-users/${userId}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${localStorage.getItem('authToken')}`
				},
				body: JSON.stringify({
					data: {
						image: imageId
					}
				})
			});

			if (!updateResponse.ok) {
				throw new Error('Failed to update user profile');
			}

			const updatedUserData = await updateResponse.json();
			userDataStore.update((userData) => ({
				...userData,
				image: {
					data: {
						attributes: {
							url: imageUrl
						}
					}
				}
			}));

			profileImage = imageUrl;
		} catch (error) {
			console.error("Upload error:", error);
			errorMessage = error.message || 'Failed to upload profile image';
		} finally {
			isLoading = false;
			isProfileImageModalOpen = false;
			if (cropper) {
				cropper.destroy();
				croppedBlob = null;
			}
		}
	}

	function openProfileImageModal() {
		isProfileImageModalOpen = true;
	}

	function closeProfileImageModal() {
		isProfileImageModalOpen = false;
		if (cropper) {
			cropper.destroy();
			croppedBlob = null;
		}
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
			<img
				src={profileImage}
				alt="ProfileImage"
				class="w-24 h-24 rounded-full object-cover cursor-pointer"
				on:click={openProfileImageModal}
			/>
			<div class="absolute bottom-0 left-1/2 transform -translate-x-1/8">
				<Edit />
			</div>
		</div>

		{#if isLoading}
			<p class="text-neutral-grey-3 mt-2">Uploading...</p>
		{/if}
		{#if errorMessage}
			<p class="text-red-500 mt-2">{errorMessage}</p>
		{/if}

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

<!-- Profile Image Upload Modal with Cropper -->
{#if isProfileImageModalOpen}
	<div class="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50">
		<div class="bg-white p-6 rounded shadow-lg w-96">
			<h2 class="text-lg font-semibold mb-4">Upload Profile Image</h2>
			<input type="file" accept="image/*" on:change={handleImageSelect} class="mb-4" />
			<div class="mb-4">
				<img bind:this={imageElement}  class="max-w-full h-auto" />
			</div>
			{#if isLoading}
				<div class="text-center mb-4">
					<p class="text-neutral-grey-3">Uploading...</p>
					<!-- Simple loader animation -->
					<div class="w-8 h-8 border-4 border-t-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
				</div>
			{/if}
			<div class="flex justify-end space-x-2">
				<button on:click={closeProfileImageModal} class="px-4 py-2 bg-gray-300 rounded">Cancel</button>
				<button on:click={handleProfileImageUpload} class="px-4 py-2 bg-blue-500 text-white rounded" disabled={isLoading}>
					Upload
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.animate-spin {
		animation: spin 1s linear infinite;
	}
	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}
</style>