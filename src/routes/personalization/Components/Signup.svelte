<script lang="ts">
	import { goto } from '$app/navigation';
	import Button from '$lib/components/Button/Button.svelte';
	import { Gender, MenstrualFlowType } from '$lib/messages/User.msg';
	import { userSignupRequestStore } from '$lib/store/userSignupRequestStore';
	import { storeUserData, userSignup, getUserDataByFieldType } from '$lib/utils/api/services';
	import { setAuthCookie } from '$lib/utils/helpers/auth.helper';
	import { handelBack } from '$lib/store/navigationStore';
	import { userDataStore } from '$lib/store/userDataStore';
	import { toast } from 'svelte-french-toast';
	import Back from '$lib/icons/BackIcon.svelte';
	import { browser } from '$app/environment';

	import { auth } from '$lib/firebase/client';
import { RecaptchaVerifier,signInWithPhoneNumber  } from 'firebase/auth';


	const errors = {
		name: '',
		mobileNumber: '',
		email: '',
		password: ''
	};

	let otp = '';
	let loading = false;
	let otpSent = false;
	let otpVerified = false;
	let confirmationResult: any = null;

	function validateForm() {
		errors.name = $userSignupRequestStore.name ? '' : 'Name is required';
		errors.mobileNumber = $userSignupRequestStore.mobileNumber ? '' : 'Mobile number is required';
		errors.email = $userSignupRequestStore.email ? '' : 'Email is required';
		errors.password = $userSignupRequestStore.password ? '' : 'Password is required';
		return Object.values(errors).every((error) => error === '');
	}


async function setupRecaptcha() {
	if (!browser) return;

	if (!window.recaptchaVerifier) {
		window.recaptchaVerifier = new RecaptchaVerifier(
			auth,
			'recaptcha-container',
			{
				size: 'invisible',
				callback: (response) => {
					console.log('reCAPTCHA solved', response);
				}
			}
		);

		await window.recaptchaVerifier.render();
	}
}



async function sendOTP() {
	try {
		await setupRecaptcha(); // ensure it's initialized + rendered

		const appVerifier = window.recaptchaVerifier;
		if (!appVerifier) throw new Error('reCAPTCHA verifier not ready');

		const phoneNumber = `+91${$userSignupRequestStore.mobileNumber}`;
		console.log('Sending OTP to:', phoneNumber);

		confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
		otpSent = true;
		toast.success('OTP sent successfully');
	} catch (error) {
		console.error('OTP Error:', error);

		if (error.code === 'auth/invalid-phone-number') {
			toast.error('Invalid phone number format');
		} else if (error.code === 'auth/invalid-app-credential') {
			toast.error('reCAPTCHA failed. Try refreshing the page.');
		} else {
			toast.error('Failed to send OTP');
		}

		// Reset reCAPTCHA
		if (window.recaptchaVerifier) {
			window.recaptchaVerifier.clear();
			window.recaptchaVerifier = undefined;
		}
	}
}



	async function verifyOTP() {
		try {
			await confirmationResult.confirm(otp);
			otpVerified = true;
			toast.success('Phone number verified');
		} catch (err) {
			console.error(err);
			toast.error('Invalid OTP');
		}
	}

	async function storeUserDataHandler() {
		try {
			const res = await storeUserData($userSignupRequestStore);
			console.log(res);
		} catch (error) {
			console.error('Failed to store user data:', error);
			toast.error('Failed to store user data.');
		}
	}

	async function signupHandler() {
		loading = true;
		try {
			const res = await userSignup(
				$userSignupRequestStore.email,
				$userSignupRequestStore.mobileNumber,
				$userSignupRequestStore.password
			);

			if (res == null) {
				toast.error('User already exists');
				loading = false;
				return;
			}

			if (res?.jwt) {
				setAuthCookie(res.jwt);
				await storeUserDataHandler();
				localStorage.setItem('authToken', res.jwt);

				const userDataRes = await getUserDataByFieldType('email', $userSignupRequestStore.email);
				if (userDataRes?.data?.length > 0) {
					const userData = userDataRes.data[0];
					const userId = userData.id;
					localStorage.setItem('userId', userId);
					userDataStore.set(userData.attributes);
					localStorage.setItem('user', JSON.stringify(userData.attributes));
					toast.success('Signup successful! Redirecting...');
					await goto('/community');
				} else {
					toast.error('Signup success, but user data fetch failed');
				}
			}
		} catch (error) {
			console.error('Signup failed:', error);
			toast.error('Signup failed. Please try again.');
		} finally {
			loading = false;
		}
	}

	function handleSubmit() {
		if (!validateForm()) {
			toast.error('Please fill in all fields');
			return;
		}
		if (!otpVerified) {
			toast.error('Please verify your phone number');
			return;
		}
		signupHandler();
	}
</script>

<div class="min-h-screen w-full flex flex-col items-center justify-center px-4 bg-gray-50">
	<div class="px-8 flex flex-row items-center justify-center">
		<button class="absolute top-9 left-8" on:click={handelBack}>
			<Back />
		</button>
	</div>
	<div class="max-w-md w-full space-y-8">
		<h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">Create your account</h2>
		<form class="mt-8 space-y-6" on:submit|preventDefault={handleSubmit}>
			<div class="rounded-md shadow-sm -space-y-px">
				<!-- Name -->
				<div class="pt-2 pb-4">
					<input id="name" name="name" type="text" required bind:value={$userSignupRequestStore.name} placeholder="Username"
						class="block w-full px-3 py-3 border border-gray-300 text-gray-900 rounded-md sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
					{#if errors.name}<p class="text-sm text-red-600">{errors.name}</p>{/if}
				</div>

				<!-- Mobile -->
				<div class="pt-2 pb-4">
					<input id="mobileNumber" name="mobileNumber" type="tel" required bind:value={$userSignupRequestStore.mobileNumber} placeholder="Mobile Number"
						class="block w-full px-3 py-3 border border-gray-300 text-gray-900 rounded-md sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
					{#if errors.mobileNumber}<p class="text-sm text-red-600">{errors.mobileNumber}</p>{/if}
					<div class="mt-2">
						{#if !otpSent}
							<button type="button" on:click={sendOTP} class="text-blue-500 underline text-sm">Send OTP</button>
						{/if}
					</div>
				</div>

				<!-- OTP -->
				{#if otpSent && !otpVerified}
					<div class="pt-2 pb-4">
						<input type="text" bind:value={otp} placeholder="Enter OTP"
							class="block w-full px-3 py-3 border border-gray-300 text-gray-900 rounded-md sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
						<button type="button" on:click={verifyOTP} class="mt-2 text-blue-600 underline text-sm">Verify OTP</button>
					</div>
				{/if}

				<!-- Email -->
				<div class="pt-2 pb-4">
					<input id="email" name="email" type="email" required bind:value={$userSignupRequestStore.email} placeholder="Email address"
						class="block w-full px-3 py-3 border border-gray-300 text-gray-900 rounded-md sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
					{#if errors.email}<p class="text-sm text-red-600">{errors.email}</p>{/if}
				</div>

				<!-- Password -->
				<div class="pt-2 pb-4">
					<input id="password" name="password" type="password" required bind:value={$userSignupRequestStore.password} placeholder="Password"
						class="block w-full px-3 py-3 border border-gray-300 text-gray-900 rounded-md sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
					{#if errors.password}<p class="text-sm text-red-600">{errors.password}</p>{/if}
				</div>
			</div>

			<!-- reCAPTCHA (hidden) -->
			<div id="recaptcha-container"></div>

			<!-- Submit -->
			<Button variant="primary" fullWidth type="submit" disabled={loading || !otpVerified}>
				{#if loading}
					<svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
						<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
					</svg>
				{:else}
					Next
				{/if}
			</Button>
		</form>
	</div>
</div>
