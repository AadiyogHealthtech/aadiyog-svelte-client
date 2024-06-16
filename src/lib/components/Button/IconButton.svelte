<script lang="ts">
	import Tick from '$lib/icons/TickIcon.svelte';
	import { createEventDispatcher } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	interface $$Props extends HTMLButtonAttributes {
		selected?: boolean;
		width: number;
		height: number;
		id: string;
		removeTick?: boolean;
		rounded: string;
	}

	const BASE_STYLES = `w-${$$restProps.width} h-${$$restProps.height} relative font-semibold px-4 py-3 rounded-${$$restProps.rounded} flex flex-col justify-center items-center`;

	export let selected = false;
	const dispatch = createEventDispatcher();

	function handleClick(e: MouseEvent) {
		selected = !selected;
		dispatch('click', e);
	}
</script>

<button
	{...$$restProps}
	data-testid={$$restProps.id}
	on:click={handleClick}
	class={BASE_STYLES}
	class:border-2={selected}
	class:border-primary={selected}
	class:text-primary={selected}
	class:border={!selected}
	class:border-neutral={!selected}
	class:text-neutral={!selected}
>
	{#if selected && !$$restProps.removeTick}
		<div class="customClass">
			<Tick />
		</div>
	{/if}
	<slot />
</button>

<style>
	.customClass {
		position: absolute;
		top: -10px;
		right: -10px;
	}
</style>
