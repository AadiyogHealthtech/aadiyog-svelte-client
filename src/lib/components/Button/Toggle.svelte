<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	interface $$Props extends HTMLAttributes<HTMLDivElement> {
		variant?: 'selected' | 'notSelected';
		id: string;
	}

	const BASE_STYLES = 'bg-neutral-grey-11 w-20 px-3 py-2 rounded-full';

	const VARIANT_STYLES: {
		[key: string]: string;
	} = {
		notSelected: ' text-neutral',
		selected: 'text-primary'
	};

	const dispatch = createEventDispatcher();

	function handleClick(e: MouseEvent) {
		checked = !checked;
		dispatch('click', { checked });
	}

	let checked = false;
</script>

<div
	{...$$restProps}
	data-testid={$$restProps.id}
	class="{BASE_STYLES} {VARIANT_STYLES[$$restProps.variant] ||
		VARIANT_STYLES['notSelected']} {$$restProps.class || ''}"
	class:bg-primary={checked}
>
	<button
		on:click={handleClick}
		class="customClass bg-white w-5 h-5 rounded-full shadow-lg block"
		style={!checked ? 'margin-left: 0;' : 'margin-left : auto;'}
	/>
	<slot />
</div>

<style>
	.customClass {
		transition: margin-left 3s ease-out;
	}
</style>
