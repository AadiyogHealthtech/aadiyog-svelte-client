<script lang="ts">
	import { goto } from '$app/navigation';
	import Button from '$lib/components/Button/Button.svelte';
	import Back from '$lib/icons/BackIcon.svelte';
	import Google from '$lib/icons/GoogleIcon.svelte';
	import { authStore } from '$lib/store/authStore';
	import { userDataStore } from '$lib/store/userDataStore';
	import { getUserDataByFieldType, userLogin } from '$lib/utils/api/services';
	import { validateSession } from '$lib/utils/helpers/misc.helper';
	import { onMount } from 'svelte';
	let mobile = '';
	let password = '';
	function handelBack() {
		goto('/user-profile/1');
	}
	onMount(() => {
		validateSession();
	});
	async function fetchUserData() {
		const res = await getUserDataByFieldType('mobileNumber', mobile);
		console.log(res);
		if (res?.data?.length > 0) {
			const userData = res?.data[0];
			userDataStore.set(userData?.attributes);
			console.log(userData);
			localStorage.setItem('user', JSON.stringify(userData?.attributes));
			alert('User logged in successfully');
			goto('/');
		} else {
			alert('something went wrong!');
		}
	}
	async function handleLogin() {
		const res = await userLogin(mobile, password);
		if (res?.jwt && res?.user) {
			localStorage.setItem('token', res?.jwt);
			authStore.set(res?.jwt);
			fetchUserData();
		} else {
			alert('Incorrect username or password');
		}
	}
</script>

<div class="py-8 h-screen w-full">
	<div class="px-8 flex flex-row items-center justify-center">
		<button class="absolute top-9 left-8" on:click={handelBack}>
			<Back />
		</button>
		<h2 class="text-neutral-grey-3 font-semibold">Login or sign up</h2>
	</div>

	<div class="px-8 mt-12">
		<h2 class="text-neutral-grey-2">Enter your mobile number</h2>
		<input
			bind:value={mobile}
			type="number"
			class="mt-4 w-full px-4 py-3 bg-neutral-grey-11 rounded-md shadow-inner text-lg"
			placeholder="Enter mobile number"
		/>
		<input
			bind:value={password}
			type="password"
			class="mt-4 w-full px-4 py-3 bg-neutral-grey-11 rounded-md shadow-inner text-lg"
			placeholder="Enter Password"
		/>
		<div class="mt-6">
			<Button id="Continue" variant="primary" fullWidth on:click={handleLogin}>Continue</Button>
		</div>
	</div>

	<div class="flex flex-row mt-12 items-center justify-center w-full">
		<div class="bg-neutral-grey-6 h-px w-full" />
		<div class="absolute px-2 py-2 bg-white flex items-center justify-center">
			<h3 class="text-neutral-grey-4 font-semibold">or</h3>
		</div>
	</div>

	<div class="px-8 relative mt-12">
		<div class="absolute top-2.5 left-12">
			<Google />
		</div>
		<Button id="Google" fullWidth variant="ghost">
			<h3 class="text-neutral-grey-2 font-normal">Continue with Google</h3>
		</Button>
	</div>
</div>
