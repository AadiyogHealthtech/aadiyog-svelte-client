<script lang="ts">
	import Button from '$lib/components/Button/Button.svelte';
	import Plan from '$lib/components/Subscription/Plan.svelte';
	import Tick1 from '$lib/icons/Tick1Icon.svelte';
	import Close from '$lib/icons/CrossIcon.svelte';
	import { goto } from '$app/navigation';

	export let steps = [
		'Get access to full course',
		'Connect with our community',
		'Get professional guidance through call'
	];

	export let plans = [
		{
			id: 'Yearly',
			planName: 'Yearly plan',
			planPrice: '₹799',
			totalPrice: '₹799',
			off: '0%'
		},
		{
			id: 'Quarterly',
			planName: 'Quarterly plan',
			planPrice: '₹649',
			totalPrice: '₹1,947',
			off: '0%'
		},
		{
			id: 'Monthly',
			planName: 'Monthly plan',
			planPrice: '₹499',
			totalPrice: '₹5,988',
			off: '0%'
		}
	];

	let selectedPlanId: string | null = null;
	let showModal: boolean = true;

	function handlePlanSelect(planId: string) {
		selectedPlanId = planId;
	}

	function toggleModal() {
		showModal = true;  // Directly open the modal
	}

	function handelClose() {
		showModal = false;
		goto('/course-details/1');
	}

	function handelPayment() {
		goto('/payment-gateway');
	}
</script>

<!-- Modal -->
{#if showModal}
<div
	class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-end z-50"
	aria-modal="true"
	role="dialog"
>
	<div
		class="relative bg-white rounded-t-lg shadow-lg w-full sm:max-w-lg md:max-w-md lg:max-w-lg p-4 sm:p-6 z-60 slide-up"
		style="height: auto; min-height: 60vh;"
	>
		<!-- Close Button -->
		<div class="flex justify-end">
			<button
				class="p-2 rounded-full focus:outline-none hover:bg-gray-200"
				aria-label="Close modal"
				on:click={handelClose}
			>
				<Close />
			</button>
		</div>

		<!-- Modal Title -->
		<div class="text-center">
			<h2 class="text-neutral-grey-2 font-bold text-lg">
				Yoga for Vitality: Beginner’s Guide for Thyroid Wellness
			</h2>
		</div>

		<!-- Steps List -->
		<div class="mt-6">
			{#each steps as step}
				<div class="flex flex-row items-start my-2">
					<Tick1 />
					<h3 class="ml-2 text-neutral-grey-3">{step}</h3>
				</div>
			{/each}
		</div>

		<!-- Plans List -->
		<div class="mt-6">
			{#each plans as plan}
            <!-- class="mt-6 border rounded-lg p-4 cursor-pointer hover:border-blue-500" -->
				<div					
                    class="mt-6 "
					role="button"
					tabindex="0"
					on:click={() => handlePlanSelect(plan.id)}
					on:keydown={(event) => {
						if (event.key === 'Enter' || event.key === ' ') handlePlanSelect(plan.id);
					}}
				>
					<Plan
						id={plan.id}
						planName={plan.planName}
						planPrice={plan.planPrice}
						totalPrice={plan.totalPrice}
						off={plan.off}
						isSelected={selectedPlanId === plan.id}
					/>
				</div>
			{/each}
		</div>

		<!-- Terms and Button -->
		<div class="w-full mt-6">
			<button>
				<h4 class="text-neutral-grey-4 underline text-sm mb-4">Read Terms and Conditions</h4>
			</button>
			<Button id="Continue" fullWidth variant="primary" on:click={handelPayment}>
				Continue
			</Button>
		</div>
	</div>
</div>
{/if}

<style>
	/* Slide-up animation for the modal */
	@keyframes slide-up {
		from {
			transform: translateY(100%);
		}
		to {
			transform: translateY(0);
		}
	}

	/* Slide-up animation for the modal */
	.slide-up {
		animation: slide-up 0.3s ease-out;
	}
</style>
