<script lang="ts">
	import Button from '$lib/components/Button/Button.svelte';
	import Plan from '$lib/components/Subscription/Plan.svelte';
	import Tick1 from '$lib/icons/Tick1Icon.svelte';
	import Close from '$lib/icons/CrossIcon.svelte';
	import { goto } from '$app/navigation';

	export let steps = [
		'Get access to full course  ',
		'Connect with our comnunity',
		'Get professional guidance through call'
	];
	export let plans = [
		{
			id: 'Yearly',
			planName: 'Yearly plan',
			planPrice: '₹499',
			totalPrice: '₹5,988',
			off: '0%'
		},
		{
			id: 'Quarterly',
			planName: 'Quarterly plan',
			planPrice: '₹344',
			totalPrice: '₹1,032',
			off: '31%'
		},
		{
			id: 'Monthly',
			planName: 'Monthly plan',
			planPrice: '₹499',
			totalPrice: '₹5,988',
			off: '0%'
		}
	];

	function handelClose() {
		goto('/');
	}
	function handelPayment() {
		goto('/payment-gateway');
	}
</script>

<div class="px-8 py-8 h-screen w-full flex flex-col items-center">
	<div class="w-full flex justify-end" on:click={handelClose}>
		<Close />
	</div>

	<div>
		<h2 class="text-neutral-grey-2 font-bold">
			Yoga for vitality: Beginner’s guide for thyroid wellness
		</h2>
		<div class="mt-8">
			{#each steps as step, index}
				<div class="flex flex-row items-start my-2">
					<Tick1 />
					<h3 class="ml-2 text-neutral-grey-3">{step}</h3>
				</div>
			{/each}
		</div>
		<div class="mt-8">
			{#each plans as plan, index}
				<div class="mt-6">
					<Plan
						id={plan.id}
						planName={plan.planName}
						planPrice={plan.planPrice}
						totalPrice={plan.totalPrice}
						off={plan.off}
					/>
				</div>
			{/each}
		</div>
	</div>

	<div class="w-full px-8 absolute bottom-10 flex flex-col items-center justify-center">
		<button>
			<h4 class="text-neutral-grey-4 underline mb-4">Read Terms and Conditions</h4>
		</button>
		<Button id="Continue" fullWidth variant="primary" on:click={handelPayment}>Continue</Button>
	</div>
</div>
