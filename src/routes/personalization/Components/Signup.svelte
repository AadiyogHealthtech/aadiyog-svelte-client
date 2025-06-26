<script lang="ts">
	import { goto } from '$app/navigation';
	import Button from '$lib/components/Button/Button.svelte';
	import { Gender, MenstrualFlowType } from '$lib/messages/User.msg';
	import { authStore } from '$lib/store/authStore';
	import { userSignupRequestStore } from '$lib/store/userSignupRequestStore';
	import { storeUserData, userSignup, getUserDataByFieldType } from '$lib/utils/api/services';
	import { AUTH_TOKEN_KEY } from '$lib/utils/constants';
	import { setAuthCookie } from '$lib/utils/helpers/auth.helper';
	import { setCookie } from '$lib/utils/helpers/commons';
	import { handelBack } from '$lib/store/navigationStore';
	import Back from '$lib/icons/BackIcon.svelte';
	import { userDataStore } from '$lib/store/userDataStore';
	import { toast } from 'svelte-french-toast';

	const errors = {
		name: '',
		mobileNumber: '',
		email: '',
		password: ''
	};

	let mobile = '';
	let loading = false; // Track loading state

	function validateForm() {
		errors.name = $userSignupRequestStore.name ? '' : 'Name is required';
		errors.mobileNumber = $userSignupRequestStore.mobileNumber ? '' : 'Mobile number is required';
		errors.email = $userSignupRequestStore.email ? '' : 'Email is required';
		errors.password = $userSignupRequestStore.password ? '' : 'Password is required';

		return Object.values(errors).every((error) => error === '');
	}

	async function signupHandler() {
		loading = true; // Start loading
		try {
			const res = await userSignup(
				$userSignupRequestStore.email,
				$userSignupRequestStore.mobileNumber,
				$userSignupRequestStore.password
			);

			if (res == null) {
				toast.error('User already signed up with these credentials');
				loading = false; // Stop loading
				return;
			}

			if (res?.jwt) {
				setAuthCookie(res.jwt);
				await storeUserDataHandler();
				localStorage.setItem('authToken', res.jwt);

				const userDataRes = await getUserDataByFieldType('email', $userSignupRequestStore.email);
				// console.log("userDataRes: ", userDataRes);
				if (userDataRes?.data?.length > 0) {
					const userData = userDataRes.data[0];
					const userId = userDataRes.data[0].id;
					// // console.log("userId: ", userId);
					localStorage.setItem('userId', userId);
					// console.log(localStorage.getItem('userId'));
					userDataStore.set(userData.attributes);
					localStorage.setItem('user', JSON.stringify(userData.attributes));
					toast.success('Signup successful! Redirecting...');
					await goto('/community');
				} else {
					toast.error('Unable to fetch user data. Signup successful but data retrieval failed.');
				}
			}
		} catch (error) {
			console.error('Signup failed:', error);
			toast.error('Signup failed. Please try again.');
		} finally {
			loading = false; // Stop loading
		}
	}

	async function storeUserDataHandler() {
		try {
			const res = await storeUserData($userSignupRequestStore);
			console.log(res);
		} catch (error) {
			console.error('Failed to store user data:', error);
			toast.error('Failed to store user data. Please try again.');
		}
	}

	function handleSubmit() {
		if (!validateForm()) {
			toast.error('Please fill in all required fields');
			return;
		}

		const req = {
			...$userSignupRequestStore,
			age: parseFloat(($userSignupRequestStore.age ?? '').toString()),
			height: parseFloat(($userSignupRequestStore.height ?? '').toString()),
			sleepTime: parseFloat(($userSignupRequestStore.sleepTime ?? '').toString()),
			weight: parseFloat(($userSignupRequestStore.weight ?? '').toString())
		};

		if (
			req.gender === Gender.Female &&
			$userSignupRequestStore.menstrualFlow !== MenstrualFlowType.NA
		) {
			const last7thDay = new Date();
			last7thDay.setDate(last7thDay.getDate() - 7);
			req.menstrualFlow = {
				lastCycleStartDate: last7thDay,
				lastyCycleDuration: 5,
				avgCycleLength: 28
			};
		}

		signupHandler();
	}
</script>

<div class="min-h-screen w-full flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 bg-gray-50">
	<div class="px-8 flex flex-row items-center justify-center">
		<button class="absolute top-9 left-8" on:click={handelBack}>
			<Back />
		</button>
	</div>
	<div class="max-w-md w-full space-y-8">
		<div>
			<h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">Create your account</h2>
		</div>
		<form class="mt-8 space-y-6" on:submit|preventDefault={handleSubmit}>
			<div class="rounded-md shadow-sm -space-y-px">
				<div class="pt-2 pb-4">
					<label for="name" class="sr-only">Name</label>
					<input
						id="name"
						name="name"
						type="text"
						required
						class="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
						placeholder="Username"
						bind:value={$userSignupRequestStore.name}
					/>
					{#if errors.name}
						<p class="mt-2 text-sm text-red-600" id="name-error">{errors.name}</p>
					{/if}
				</div>

				<div class="pt-2 pb-4">
					<label for="mobileNumber" class="sr-only">Mobile Number</label>
					<input
						id="mobileNumber"
						name="mobileNumber"
						type="tel"
						required
						class="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
						placeholder="Mobile Number"
						bind:value={$userSignupRequestStore.mobileNumber}
					/>
					{#if errors.mobileNumber}
						<p class="mt-2 text-sm text-red-600" id="mobileNumber-error">{errors.mobileNumber}</p>
					{/if}
				</div>
				<div class="pt-2 pb-4">
					<label for="email" class="sr-only">Email address</label>
					<input
						id="email"
						name="email"
						type="email"
						autocomplete="email"
						required
						class="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
						placeholder="Email address"
						bind:value={$userSignupRequestStore.email}
					/>
					{#if errors.email}
						<p class="mt-2 text-sm text-red-600" id="email-error">{errors.email}</p>
					{/if}
				</div>
				<div class="pt-2 pb-4">
					<label for="password" class="sr-only">Password</label>
					<input
						id="password"
						name="password"
						type="password"
						autocomplete="current-password"
						required
						class="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
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
					disabled={loading} 
				>
					{#if loading}
					
						<svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
						</svg>
					{:else}
						Next
					{/if}
				</Button>
			</div>
		</form>
	</div>
</div>