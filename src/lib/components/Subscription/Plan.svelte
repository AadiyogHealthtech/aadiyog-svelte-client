<script lang="ts">
	import Tick from '$lib/icons/TickIcon.svelte';

	export let id: string;
	export let planName = 'Yearly plan';
	export let planPrice = '₹499';
	export let totalPrice = '₹5,988';
	export let off = '31%';
	export let isSelected = false; // Receive the selected state from the parent

	const BASE_STYLES = 'w-full relative font-semibold px-4 py-3 rounded-lg flex flex-col';
</script>

<button
	data-testid={id}
	class={BASE_STYLES}
	class:border-2={isSelected}
	class:border-primary={isSelected}
	class:border={!isSelected}
	class:border-neutral-grey-8={!isSelected}
>
	{#if isSelected}
		<div class="customClass">
			<Tick />
		</div>
	{/if}

	<div class="flex flex-row justify-between w-full">
		<p class="font-normal text-xl">{planName}</p>
		<p class="font-semibold text-lg ms-10">{planPrice}/month</p>
	</div>

	<div
		class="flex flex-row items-center w-full"
		class:justify-end={off === '0%'}
		class:justify-between={off !== '0%'}
	>
		{#if off !== '0%'}
			<div class="bg-primary rounded-lg p-1 mt-2">
				<p class="font-semibold text-sm">{off} off</p>
			</div>
		{/if}

		<p class="font-normal text-sm ms-32">Total - {totalPrice}</p>
	</div>
</button>

<style>
	.customClass {
		position: absolute;
		top: -10px;
		right: -10px;
	}
</style>
