<script lang="ts">
	import { goto } from '$app/navigation';
	import Button from '$lib/components/Button/Button.svelte';
	import Back from '$lib/icons/BackIcon.svelte';
	import { authStore } from '$lib/store/authStore';
	import { userDataStore } from '$lib/store/userDataStore';
	import { getUserDataByFieldType, userLogin } from '$lib/utils/api/services';
	import { AUTH_TOKEN_KEY } from '$lib/utils/constants';
	import { setCookie } from '$lib/utils/helpers/commons';
	import { validateSession } from '$lib/utils/helpers/misc.helper';
	import { onMount } from 'svelte';
  
	let mobile = '';
	let password = '';
	let isInputFocused = false;
	let isButtonFocused = false;
	let isModalFullScreen = false; // New state to track if the modal should be full screen
  
	function handelBack() {
	  if (window.history.length > 2) {
		goto('/community');
	  } else {
		goto('/');
	  }
	}
  
	onMount(() => {
	  validateSession();
	});
  
	async function fetchUserData() {
	  const res = await getUserDataByFieldType('mobileNumber', mobile);
	  if (res?.data?.length > 0) {
		const userData = res?.data[0];
		console.log(userData.id);
		const userId = userData.id;
		localStorage.setItem('userId', userId);
		userDataStore.set(userData?.attributes);
		localStorage.setItem('user', JSON.stringify(userData?.attributes));
		goto('/');
	  }
	}
  
	async function handleLogin(event: Event) {
		
	  event.preventDefault();
	  const res = await userLogin(mobile, password);
	  if (res?.jwt && res?.user) {
		console.log("userId",res);
		localStorage.setItem('authToken', res.jwt);
		localStorage.setItem('user', JSON.stringify(res.user.attributes));
		setCookie(AUTH_TOKEN_KEY, res.jwt);
		authStore.set(res.jwt);
		fetchUserData();
		goto('/community');
	  } else {
		alert('Incorrect username or password');
	  }
	}
  
	function handleClickSignup() {
	  goto('/onboarding');
	}
	 
	function handleFocus() {
	  isButtonFocused = true;
	}
  
	function handleBlur() {
	  isButtonFocused = false;
	}

	// This function will set the modal to full screen when the buttons are clicked
	function setModalToFullScreen() {
	  isModalFullScreen = true;
	}
</script>

<style>
	.modal-container {
	  position: fixed;
	  bottom: 0;
	  left: 0;
	  width: 100%;
	  height: auto;
	  background-color: white;
	  box-shadow: 0 -4px 6px rgba(0, 0, 0, 0.1);
	  border-top-left-radius: 16px;
	  border-top-right-radius: 16px;
	  padding: 16px;
	  transition: all 0.3s ease-in-out;
	  z-index: 10;
	}
  
	.modal-fullscreen {
	  height: 100%;
	  top: 0;
	  border-radius: 0;
	}
  
	.backdrop {
	  position: fixed;
	  top: 0;
	  left: 0;
	  width: 100%;
	  height: 100%;
	  transition: background-color 0.3s ease-in-out;
	  z-index: 9;
	}
  
	.backdrop-gray {
	  background-color: rgba(128, 128, 128, 0.5);
	  background-image: url('../../../lib/Images/CommunityWall.png');
	  background-size: cover;
	  background-position: center -50px;
	  background-repeat: no-repeat;
	  filter: blur(8px);
	}
  
	.backdrop-transparent {
	  background-color: rgba(0, 0, 0, 0);
	}
  
	.focus-button {
	  border: 2px solid #3b82f6;
	  background-color: #eff6ff;
	}
</style>

<div class="backdrop {isInputFocused ? 'backdrop-transparent' : 'backdrop-gray'}"></div>
<div class="modal-container {isInputFocused || isButtonFocused || isModalFullScreen ? 'modal-fullscreen' : ''}">
	<div class="px-8 flex flex-row items-center justify-center">
		<button class="absolute top-4 left-4" on:click={handelBack}>
			<Back />
		</button>
		<h2 class="text-neutral-grey-3 font-semibold">Login or sign up</h2>
	</div>

	<form class="mt-8 mx-2" on:submit={handleLogin}>
		<h2 class="text-neutral-grey-2">Enter your mobile number</h2>
		<input
			required
			bind:value={mobile}
			type="number"
			inputmode="tel"
			class="mt-4 w-full px-4 py-3 bg-neutral-grey-11 rounded-md shadow-inner text-lg"
			placeholder="Enter mobile number"
			on:focus={() => { isInputFocused = true; handleFocus(); }}
			on:blur={() => { isInputFocused = false; handleBlur(); }}
		/>
		<input
			required
			bind:value={password}
			type="password"
			class="mt-4 w-full px-4 py-3 bg-neutral-grey-11 rounded-md shadow-inner text-lg"
			placeholder="Enter Password"
			on:focus={() => { isInputFocused = true; handleFocus(); }}
			on:blur={() => { isInputFocused = false; handleBlur(); }}
		/>
		<div class="mt-6">
			<Button id="Continue" variant="primary" fullWidth type="submit" >Continue</Button>
		</div>
	</form>

	<div class="flex flex-row mt-12 items-center justify-center w-full">
		<div class="bg-neutral-grey-6 h-px w-full" />
		<div class="absolute px-2 py-2 bg-white flex items-center justify-center">
			<h3 class="text-neutral-grey-4 font-semibold">or</h3>
		</div>
	</div>

	<div class="px-8 relative mt-12">
		<Button id="Signup" fullWidth variant="ghost" on:click={() => { handleClickSignup(); }}>
			<h3 class="text-neutral-grey-2 font-normal">Signup</h3>
		</Button>
	</div>
</div>
