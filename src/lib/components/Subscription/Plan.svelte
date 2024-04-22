<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import Tick from '$lib/icons/Tick.svelte';

	interface $$Props extends HTMLButtonAttributes {
		id: string;
	}

	const BASE_STYLES = 'relative font-semibold px-4 py-3 rounded-lg flex flex-col';

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
	<div class="flex flex-row">
		<p class="font-normal text-xl">Quarterly plan</p>
		<p class="font-semibold text-lg ms-10">₹624/month</p>
	</div>
	<div class="flex flex-row items-center">
		<div class="bg-primary rounded-lg p-1 mt-2">
			<p class="font-semibold text-sm">37% off</p>
		</div>
		<p class="font-normal text-sm ms-32">Total - ₹2496</p>
	</div>
</button>

<style>
	.customClass {
		position: absolute;
		top: -10px;
		right: -10px;
	}
</style>
