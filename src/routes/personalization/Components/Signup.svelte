<script lang="ts">
	import { goto } from '$app/navigation';
	import Button from '$lib/components/Button/Button.svelte';
	import { authStore } from '$lib/store/authStore';
	import { userSignupRequestStore } from '$lib/store/userSignupRequestStore';
	import { storeUserData, userSignup } from '$lib/utils/api/services';

	let errors = {
		name: '',
		mobileNumber: '',
		email: '',
		password: ''
	};

	function validateForm() {
		errors.name = $userSignupRequestStore.name ? '' : 'Name is required';
		errors.mobileNumber = $userSignupRequestStore.mobileNumber ? '' : 'Mobile number is required';
		errors.email = $userSignupRequestStore.email ? '' : 'Email is required';
		errors.password = $userSignupRequestStore.password ? '' : 'Password is required';

		return Object.values(errors).every((error) => error === '');
	}

	async function signupHandler() {
		const res = await userSignup(
			$userSignupRequestStore.mobileNumber,
			$userSignupRequestStore.email,
			$userSignupRequestStore.password
		);
		if (res?.jwt) {
			authStore.set(res?.jwt);
			localStorage.setItem('token', res?.jwt);
			storeUserDataHandler();
		}
	}
	async function storeUserDataHandler() {
		const res = await storeUserData($userSignupRequestStore);
		console.log(res);
	}

	function handleClick() {
		$userSignupRequestStore = {
			email: 'email@gmail.com',
			password: 'email@123',
			gender: 'Male',
			name: 'Rishi',
			yogaLevel: 'beginner',
			age: 21,
			height: 211,
			medicalConditions: ['pcos', 'spineIssue'],
			menstrualFlow: 'irregular',
			sleepTime: 2,
			weight: 2,
			mobileNumber: '7897897891'
		};
		console.log($userSignupRequestStore);
		// signupHandler();
		storeUserDataHandler();
		if (!validateForm()) {
		}
	}
</script>

<div
	class="min-h-screen w-full flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 bg-gray-50"
>
	<div class="max-w-md w-full space-y-8">
		<div>
			<h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">Create your account</h2>
		</div>
		<form class="mt-8 space-y-6" on:submit|preventDefault={handleClick}>
			<div class="rounded-md shadow-sm -space-y-px">
				<div>
					<label for="name" class="sr-only">Name</label>
					<input
						id="name"
						name="name"
						type="text"
						required
						class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
						placeholder="Name"
						bind:value={$userSignupRequestStore.name}
					/>
					{#if errors.name}
						<p class="mt-2 text-sm text-red-600" id="name-error">{errors.name}</p>
					{/if}
				</div>
				<div>
					<label for="mobileNumber" class="sr-only">Mobile Number</label>
					<input
						id="mobileNumber"
						name="mobileNumber"
						type="tel"
						required
						class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
						placeholder="Mobile Number"
						bind:value={$userSignupRequestStore.mobileNumber}
					/>
					{#if errors.mobileNumber}
						<p class="mt-2 text-sm text-red-600" id="mobileNumber-error">{errors.mobileNumber}</p>
					{/if}
				</div>
				<div>
					<label for="email" class="sr-only">Email address</label>
					<input
						id="email"
						name="email"
						type="email"
						autocomplete="email"
						required
						class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
						placeholder="Email address"
						bind:value={$userSignupRequestStore.email}
					/>
					{#if errors.email}
						<p class="mt-2 text-sm text-red-600" id="email-error">{errors.email}</p>
					{/if}
				</div>
				<div>
					<label for="password" class="sr-only">Password</label>
					<input
						id="password"
						name="password"
						type="password"
						autocomplete="current-password"
						required
						class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
						placeholder="Password"
						bind:value={$userSignupRequestStore.password}
					/>
					{#if errors.password}
						<p class="mt-2 text-sm text-red-600" id="password-error">{errors.password}</p>
					{/if}
				</div>
			</div>

			<div>
				<Button
					variant="primary"
					fullWidth
					id="Next"
					type="submit"
					class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
				>
					Next
				</Button>
			</div>
		</form>
	</div>
</div>
