<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import Tick from '$lib/icons/Tick.svelte';

	interface $$Props extends HTMLButtonAttributes {
		id: string;
		planName: string;
		planPrice: string;
		totalPrice: string;
		off: string;
	}

	export let planName = 'Yearly plan';
	export let planPrice = '₹499';
	export let totalPrice = '₹5,988';
	export let off = '31%';

	const BASE_STYLES = 'w-full relative font-semibold px-4 py-3 rounded-lg flex flex-col';

	let selected = false;
	const dispatch = createEventDispatcher();

	function handleClick(e: MouseEvent) {
		selected = !selected;
		dispatch('click', e);
	}
</script>

<button
	{...$$restProps}
	data-testid={$$restProps.id}
	class={BASE_STYLES}
	class:border-2={selected}
	class:border-primary={selected}
	class:border={!selected}
	class:border-neutral-grey-8={!selected}
	on:click={handleClick}
>
	{#if selected}
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

		<p class="font-normal text-sm ms-32 ml-">Total - {totalPrice}</p>
	</div>
</button>

<style>
	.customClass {
		position: absolute;
		top: -10px;
		right: -10px;
	}
</style>
