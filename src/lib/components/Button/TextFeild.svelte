<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { HTMLButtonAttributes, HTMLInputAttributes } from 'svelte/elements';

	interface $$Props extends HTMLInputAttributes {
		inputName: string;
		// variant?: 'primary';
		fullWidth?: boolean;
		id: string;
	}

	const BASE_STYLES =
		'bg-neutral-grey-11 rounded-lg font-semibold px-8 py-3 shadow-inner border-neutral-blue outline-0 focus:border';

	// const VARIANT_STYLES: {
	// 	[key: string]: string;
	// } = {
	// 	primary: '',

	// };

	let focused = false;
	let name = '';
	export let inputName = '';

	const dispatch = createEventDispatcher();
	function handleClick(e: MouseEvent) {
		dispatch('click', e);
	}
	function handleFocus(e: FocusEvent) {
		focused = !focused;
		dispatch('focus', e);
	}
</script>

<div>
	<h1 class="text-Semantic-grey-12" class:mb-1={focused}>{inputName}</h1>
	<input
		{...$$restProps}
		data-testid={$$restProps.id}
		class="{BASE_STYLES}  {$$restProps.class || ''}"
		class:w-full={$$restProps.fullWidth}
		class:customStyles={focused}
		bind:value={name}
		on:focus={handleFocus}
		on:blur={handleFocus}
		on:click={handleClick}
	/>
</div>

<style>
	.customStyles {
		box-shadow: 0 0 0 5px #4b4ded33;
	}
</style>
