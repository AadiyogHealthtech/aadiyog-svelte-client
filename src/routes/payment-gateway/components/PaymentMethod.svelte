<!-- <script lang="ts">
	import { goto } from '$app/navigation';
	import Button from '$lib/components/Button/Button.svelte';
	import ArrowDown from '$lib/icons/ArrowDownIcon.svelte';
	import ArrowUp from '$lib/icons/ArrowUpIcon.svelte';
	import Back from '$lib/icons/BackIcon.svelte';
	import { createEventDispatcher } from 'svelte';
	export let price = '1032';
	import { onMount } from 'svelte';
	let paymentOptions = [
		{
			paymentName: 'Credit or Debit cards',
			paymentDescription:
				'Safe and secure payments via Visa, Mastercard, American Express, and more.'
		},
		{
			paymentName: 'Netbanking',
			paymentDescription: 'Choose from a wide range of banks to make your payment.'
		},
		{
			paymentName: 'UPI',
			paymentDescription: 'Enter UPI ID'
		}
	];
	let activeTab = -1;
	const dispatch = createEventDispatcher();
	function handleClick(index: number) {
		if (activeTab === index) {
			activeTab = -1;
		} else {
			activeTab = index;
		}
		dispatch('click', activeTab);
	}
	function handelBack() {
		goto('/buy-subscription');
	}
	let razorpayScriptLoaded = false;

    onMount(() => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => (razorpayScriptLoaded = true);
        document.body.appendChild(script);
    });
</script>
<div class="px-8 py-8 h-screen w-full">
	<div class="flex flex-row items-center justify-center">
		<button class="absolute top-9 left-8" on:click={handelBack}>
			<Back />
		</button>
		<h2 class="text-neutral-grey-3 font-semibold">Complete payment</h2>
	</div>

	<div class="mt-8">
		<h2 class="text-neutral-grey-3 font-bold">Order Summary</h2>
		<div
			class="px-2 py-2 mt-4 bg-neutral-grey-11 border-2 rounded-xl border-neutral-grey-10 flex flex-row justify-center items-end"
		>
			<h3 class="text-neutral-grey-2">Yoga for vitality: Beginner's guide for thyroid wellness</h3>
			<h3 class="text-neutral-grey-2 font-bold">₹{price}</h3>
		</div>
	</div>
	<div class="w-full h-px bg-neutral-grey-6 -ml-8 mt-4" />
	<div class="mt-8">
		<h2 class="text-neutral-grey-3 font-bold">Payment method</h2>
		{#each paymentOptions as option, index}
			<div class="mt-4">
				<div class="flex flex-row items-center justify-between">
					<h3 class="text-neutral-grey-4">{option.paymentName}</h3>
					{#if activeTab !== index}
						<button class="text-primary-blue font-semibold" on:click={() => handleClick(index)}
							><ArrowDown /></button
						>
					{/if}
					{#if activeTab === index}
						<button class="text-primary-blue font-semibold" on:click={() => handleClick(index)}
							><ArrowUp /></button
						>
					{/if}
				</div>
				{#if activeTab === index}
					<div class="mt-4 flex items-center justify-between">
						{#if index === 2}
							<input
								type="text"
								class="bg-neutral-grey-11 rounded-lg px-4 py-3 shadow-inner"
								placeholder={option.paymentDescription}
							/>
							<Button id="Verify" variant="primary">Verify</Button>
						{/if}
						{#if index !== 2}
							<p class="text-neutral-grey-4">{option.paymentDescription}</p>
						{/if}
					</div>
				{/if}
				{#if index !== 2}
					<div class="h-px bg-neutral-grey-6 mt-4" />
				{/if}
			</div>
		{/each}
	</div>
	<div class="absolute bottom-10 w-full pr-16">
		<Button id="Verify" fullWidth variant="primary">Complete payment</Button>
	</div>
</div> -->

<!-- <script lang="ts" declare var Razorpay: any;>
	
	import { goto } from '$app/navigation';
	import Button from '$lib/components/Button/Button.svelte';
	import ArrowDown from '$lib/icons/ArrowDownIcon.svelte';
	import ArrowUp from '$lib/icons/ArrowUpIcon.svelte';
	import Back from '$lib/icons/BackIcon.svelte';
	import { createEventDispatcher } from 'svelte';
	import { onMount } from 'svelte';
	import Razorpay from 'razorpay';
	
	export let price = '1032';

	let paymentOptions = [
		{
			paymentName: 'Credit or Debit cards',
			paymentDescription:
				'Safe and secure payments via Visa, Mastercard, American Express, and more.'
		},
		{
			paymentName: 'Netbanking',
			paymentDescription: 'Choose from a wide range of banks to make your payment.'
		},
		{
			paymentName: 'UPI',
			paymentDescription: 'Enter UPI ID'
		}
	];

	let activeTab = -1;
	const dispatch = createEventDispatcher();
	let razorpayScriptLoaded = false;

	onMount(() => {
		// Load the Razorpay Checkout script
		const script = document.createElement('script');
		script.src = 'https://checkout.razorpay.com/v1/checkout.js';
		script.onload = () => (razorpayScriptLoaded = true);
		document.body.appendChild(script);
	});

	function handleClick(index: number) {
		if (activeTab === index) {
			activeTab = -1;
		} else {
			activeTab = index;
		}
		dispatch('click', activeTab);
	}

	function handelBack() {
		goto('/buy-subscription');
	}

	// Razorpay Checkout Integration
	async function handlePayment() {
		if (!razorpayScriptLoaded) {
			alert('Payment script not loaded yet. Please try again.');
			return;
		}

		try {
			// Call backend API to create an order (replace with your API endpoint)
			const response = await fetch('/api/create-order', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ amount: parseInt(price) * 100, currency: 'INR' }) // Amount in paise
			});

			const order = await response.json();

			// Razorpay options
			const options = {
				key_id: 'YOUR_RAZORPAY_KEY',
				key: 'YOUR_KEY_ID', // Replace with your Razorpay key ID
				amount: order.amount,
				currency: order.currency,
				name: 'Yoga Wellness',
				description: 'Yoga for vitality subscription',
				order_id: order.id,
				handler: function (response: any) {
					// Payment successful
					console.log('Payment successful', response);
					alert('Payment successful! Thank you for your purchase.');
					goto('/payment-success'); // Redirect to a success page
				},
				prefill: {
					name: 'Your Name',
					email: 'your.email@example.com',
					contact: '9999999999'
				},
				theme: {
					color: '#3399cc'
				}
			};

			// Open Razorpay Checkout
			const razorpay = new Razorpay(options);
			razorpay.open();

		} catch (error) {
			console.error('Error in payment:', error);
			alert('An error occurred while processing the payment.');
		}
	}
</script>

<div class="px-8 py-8 h-screen w-full">
	<div class="flex flex-row items-center justify-center">
		<button class="absolute top-9 left-8" on:click={handelBack}>
			<Back />
		</button>
		<h2 class="text-neutral-grey-3 font-semibold">Complete payment</h2>
	</div>

	<div class="mt-8">
		<h2 class="text-neutral-grey-3 font-bold">Order Summary</h2>
		<div
			class="px-2 py-2 mt-4 bg-neutral-grey-11 border-2 rounded-xl border-neutral-grey-10 flex flex-row justify-center items-end"
		>
			<h3 class="text-neutral-grey-2">Yoga for vitality: Beginner's guide for thyroid wellness</h3>
			<h3 class="text-neutral-grey-2 font-bold">₹{price}</h3>
		</div>
	</div>
	<div class="w-full h-px bg-neutral-grey-6 -ml-8 mt-4" />
	<div class="mt-8">
		<h2 class="text-neutral-grey-3 font-bold">Payment method</h2>
		{#each paymentOptions as option, index}
			<div class="mt-4">
				<div class="flex flex-row items-center justify-between">
					<h3 class="text-neutral-grey-4">{option.paymentName}</h3>
					{#if activeTab !== index}
						<button class="text-primary-blue font-semibold" on:click={() => handleClick(index)}>
							<ArrowDown />
						</button>
					{/if}
					{#if activeTab === index}
						<button class="text-primary-blue font-semibold" on:click={() => handleClick(index)}>
							<ArrowUp />
						</button>
					{/if}
				</div>
				{#if activeTab === index}
					<div class="mt-4 flex items-center justify-between">
						{#if index === 2}
							<input
								type="text"
								class="bg-neutral-grey-11 rounded-lg px-4 py-3 shadow-inner"
								placeholder={option.paymentDescription}
							/>
							<Button id="Verify" variant="primary">Verify</Button>
						{/if}
						{#if index !== 2}
							<p class="text-neutral-grey-4">{option.paymentDescription}</p>
						{/if}
					</div>
				{/if}
				{#if index !== 2}
					<div class="h-px bg-neutral-grey-6 mt-4" />
				{/if}
			</div>
		{/each}
	</div>
	<div class="absolute bottom-10 w-full pr-16">
		<Button id="Verify" fullWidth variant="primary" on:click={handlePayment}>Complete payment</Button>
	</div>
</div> -->
<script context="module" lang="ts">
	// Declare Razorpay globally inside the module context
	declare var Razorpay: any;
</script>
<script lang="ts">
	// Declare Razorpay globally
	
	import { goto } from '$app/navigation';
	import Button from '$lib/components/Button/Button.svelte';
	import ArrowDown from '$lib/icons/ArrowDownIcon.svelte';
	import ArrowUp from '$lib/icons/ArrowUpIcon.svelte';
	import Back from '$lib/icons/BackIcon.svelte';
	import { createEventDispatcher } from 'svelte';
	import { onMount } from 'svelte';
	
	export let price = '1032';

	let paymentOptions = [
		{
			paymentName: 'Credit or Debit cards',
			paymentDescription:
				'Safe and secure payments via Visa, Mastercard, American Express, and more.'
		},
		{
			paymentName: 'Netbanking',
			paymentDescription: 'Choose from a wide range of banks to make your payment.'
		},
		{
			paymentName: 'UPI',
			paymentDescription: 'Enter UPI ID'
		}
	];

	let activeTab = -1;
	const dispatch = createEventDispatcher();
	let razorpayScriptLoaded = false;

	onMount(() => {
		// Load the Razorpay Checkout script
		const script = document.createElement('script');
		script.src = 'https://checkout.razorpay.com/v1/checkout.js';
		script.onload = () => (razorpayScriptLoaded = true);
		document.body.appendChild(script);
	});

	function handleClick(index: number) {
		if (activeTab === index) {
			activeTab = -1;
		} else {
			activeTab = index;
		}
		dispatch('click', activeTab);
	}

	function handelBack() {
		goto('/buy-subscription');
	}

	// Razorpay Checkout Integration
	// async function handlePayment() {
	// 	if (!razorpayScriptLoaded) {
	// 		alert('Payment script not loaded yet. Please try again.');
	// 		return;
	// 	}

	// 	try {
	// 		// Call backend API to create an order (replace with your API endpoint)
	// 		const response = await fetch('https://v1.app.aadiyog.in/api/create-order', {
	// 			method: 'POST',
	// 			headers: { 'Content-Type': 'application/json' },
	// 			body: JSON.stringify({ amount: parseInt(price) * 100, currency: 'INR' }) // Amount in paise
	// 		});

	// 		const order = await response.json();

	// 		// Razorpay options
	// 		const options = {
	// 			key_id: 'YOUR_RAZORPAY_KEY', // Replace with your Razorpay key ID
	// 			amount: order.amount,
	// 			currency: order.currency,
	// 			name: 'Yoga Wellness',
	// 			description: 'Yoga for vitality subscription',
	// 			order_id: order.id,
	// 			handler: function (response: any) {
	// 				// Payment successful
	// 				console.log('Payment successful', response);
	// 				alert('Payment successful! Thank you for your purchase.');
	// 				goto('/payment-success'); // Redirect to a success page
	// 			},
	// 			prefill: {
	// 				name: 'Your Name',
	// 				email: 'your.email@example.com',
	// 				contact: '9999999999'
	// 			},
	// 			theme: {
	// 				color: '#3399cc'
	// 			}
	// 		};

	// 		// Open Razorpay Checkout
	// 		const razorpay = new Razorpay(options);
	// 		razorpay.open();

	// 	} catch (error) {
	// 		console.error('Error in payment:', error);
	// 		alert('An error occurred while processing the payment.');
	// 	}
	// }
</script>

<div class="px-8 py-8 h-screen w-full">
	<div class="flex flex-row items-center justify-center">
		<button class="absolute top-9 left-8" on:click={handelBack}>
			<Back />
		</button>
		<h2 class="text-neutral-grey-3 font-semibold">Complete payment</h2>
	</div>

	<div class="mt-8">
		<h2 class="text-neutral-grey-3 font-bold">Order Summary</h2>
		<div
			class="px-2 py-2 mt-4 bg-neutral-grey-11 border-2 rounded-xl border-neutral-grey-10 flex flex-row justify-center items-end"
		>
			<h3 class="text-neutral-grey-2">Yoga for vitality: Beginner's guide for thyroid wellness</h3>
			<h3 class="text-neutral-grey-2 font-bold">₹{price}</h3>
		</div>
	</div>
	<div class="w-full h-px bg-neutral-grey-6 -ml-8 mt-4" />
	<div class="mt-8">
		<h2 class="text-neutral-grey-3 font-bold">Payment method</h2>
		{#each paymentOptions as option, index}
			<div class="mt-4">
				<div class="flex flex-row items-center justify-between">
					<h3 class="text-neutral-grey-4">{option.paymentName}</h3>
					{#if activeTab !== index}
						<button class="text-primary-blue font-semibold" on:click={() => handleClick(index)}>
							<ArrowDown />
						</button>
					{/if}
					{#if activeTab === index}
						<button class="text-primary-blue font-semibold" on:click={() => handleClick(index)}>
							<ArrowUp />
						</button>
					{/if}
				</div>
				{#if activeTab === index}
					<div class="mt-4 flex items-center justify-between">
						{#if index === 2}
							<input
								type="text"
								class="bg-neutral-grey-11 rounded-lg px-4 py-3 shadow-inner"
								placeholder={option.paymentDescription}
							/>
							<Button id="Verify" variant="primary">Verify</Button>
						{/if}
						{#if index !== 2}
							<p class="text-neutral-grey-4">{option.paymentDescription}</p>
						{/if}
					</div>
				{/if}
				{#if index !== 2}
					<div class="h-px bg-neutral-grey-6 mt-4" />
				{/if}
			</div>
		{/each}
	</div>
	<div class="absolute bottom-10 w-full pr-16">
		<Button id="Verify" fullWidth variant="primary" on:click={handlePayment}>Complete payment</Button>
	</div>
</div>
