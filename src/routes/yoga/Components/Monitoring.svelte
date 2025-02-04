<script lang="ts">
	import { onMount } from 'svelte';
	import Back from '$lib/icons/BackIcon.svelte';
	import Button from '$lib/components/Button/Button.svelte';
	import CircularCountdown from '$lib/components/countdown/CircularCountdown.svelte';
	import { goto } from '$app/navigation';
	import { initialiseUserDataRequest } from '$lib/store/userSignupRequestStore';
  
	let progressValue = 80;
	let videoElement: HTMLVideoElement | null = null;
  
	function handleBack() {
	  if (window.history.length > 2) {
		history.go(-1);
	  } else {
		goto('/');
	  }
	}
  
	function handleClick() {
	  goto('/yoga/2');
	  goto('/');
	}
  
	async function startCamera() {
	  try {
		const stream = await navigator.mediaDevices.getUserMedia({ video: true });
		if (videoElement) {
		  videoElement.srcObject = stream;
		}
	  } catch (error) {
		console.error('Error accessing camera:', error);
	  }
	}
  
	onMount(() => {
	  initialiseUserDataRequest();
	  startCamera(); // Start camera when component mounts
	});
  </script>
  
  <div class="h-screen flex flex-col items-center justify-center">
	<!-- Header -->
	<div class="px-8 flex flex-row items-center justify-center">
	  <div>
		<button class="absolute top-9 left-8 flex items-center space-x-2" on:click={handleBack}>
		  <Back />
		  <p class="pl-6 text-2xl font-bold">bhujangasana</p>
		</button>
	  </div>
	  <div class="absolute top-6 right-4">
		<CircularCountdown startValue={5} radius={20} color="blue" />
	  </div>
	</div>
  
	<!-- Camera Section -->
	<div class="flex justify-between w-full gap-4">
	  <div class="relative w-4 h-full bg-gray-200 rounded">
		<div class="absolute bottom-0 w-full bg-green-500 rounded" style="height: {progressValue}%"></div>
	  </div>
  
	  <!-- Video Element for Camera -->
	  <div class="w-[80vw] h-[75vh] bg-gray-200 border-4 border-green-500 rounded-lg flex items-center justify-center">
		<video bind:this={videoElement} autoplay playsinline class="w-full h-full object-cover rounded-lg"></video>
	  </div>
	</div>
  
	<!-- Buttons -->
	<div class="absolute bottom-10 flex w-full justify-between px-10">
	  <Button
		id="play-btn"
		class="bg-green-500 text-white hover:bg-green-600 px-6 py-3 rounded w-[100px] text-center"
	  >
		Play
	  </Button>
  
	  <Button
		id="stop-btn"
		class="bg-red-500 text-white hover:bg-red-600 px-6 py-3 rounded w-[100px] text-center"
		on:click={() => goto('/yoga/3')}
	  >
		Stop
	  </Button>
	</div>
  </div>
  