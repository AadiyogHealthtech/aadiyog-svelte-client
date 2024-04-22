<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { HTMLInputAttributes } from 'svelte/elements';
	import Error from '$lib/icons/Error.svelte';

	interface $$Props extends HTMLInputAttributes {
		inputName: string;
		fullWidth?: boolean;
		id: string;
		type?: string;
		name?: string;
	}

	const BASE_STYLES =
		'bg-neutral-grey-11 rounded-lg font-semibold px-8 py-3 shadow-inner border border-transparent outline-0 ';

	let focused = false;
	let valid = false;
	let error = false;
	export let name = '';

	const dispatch = createEventDispatcher();

	function handleFocus(e: FocusEvent) {
		focused = true;
		valid = false;
		error = false;
		dispatch('focus', e);
	}
	function handleBlur(e: FocusEvent) {
		focused = false;
		if ($$restProps.type === 'email') {
			valid = name.includes('@') && name.includes('.com');
			error = !valid;
		}
		if ($$restProps.type === 'text') {
			valid = name.length > 0;
			error = !valid;
		}
		dispatch('blur', e);
	}
	const handleInput = (e: any) => {
		name = e.target.value;
	};
</script>

<div class="relative">
	<h1 class="text-Semantic-grey-12">{$$restProps.inputName}</h1>
	<input
		{...$$restProps}
		type={$$restProps.type}
		data-testid={$$restProps.id}
		class="{BASE_STYLES} mt-1 {$$restProps.class || ''}"
		class:w-full={$$restProps.fullWidth}
		class:focused
		class:valid
		class:error
		on:input={handleInput}
		on:focus={handleFocus}
		on:blur={handleBlur}
	/>
	{#if error}
		<div class="absolute left-52 top-10">
			<Error />
		</div>
	{/if}
</div>

<style>
	.focused {
		box-shadow: 0 0 0 5px #4b4ded33;
		@apply border-neutral-blue;
	}
	.valid {
		box-shadow: 0 0 0 5px #31d0aa33;
		@apply border-semantic-Green;
	}
	.error {
		box-shadow: 0 0 0 5px #ed4b9e33;
		@apply border-semantic-Red;
	}
</style>
