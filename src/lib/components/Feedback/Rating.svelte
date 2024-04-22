<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import Star from '$lib/icons/Star.svelte';
	import Close from '$lib/icons/X.svelte';
	import Button from '../Button/Button.svelte';

	interface $$Props extends HTMLAttributes<HTMLDivElement> {
		inputName: string;
		fullWidth?: boolean;
		id: string;
	}

	const BASE_STYLES = 'px-8 py-3';

	let stars = 0;
	const dispatch = createEventDispatcher();
	function handleClick1(e: MouseEvent) {
		stars = 1;
		dispatch('click', stars);
	}
	function handleClick2(e: MouseEvent) {
		stars = 2;
		dispatch('click', stars);
	}
	function handleClick3(e: MouseEvent) {
		stars = 3;
		dispatch('click', stars);
	}
	function handleClick4(e: MouseEvent) {
		stars = 4;
		dispatch('click', stars);
	}
	function handleClick5(e: MouseEvent) {
		stars = 5;
		dispatch('click', stars);
	}
	function handleClose(e: MouseEvent) {}
	function handleSubmit(e: any) {
		console.log('submit');
	}
</script>

<div
	{...$$restProps}
	data-testid={$$restProps.id}
	class="{BASE_STYLES}  {$$restProps.class || ''}"
	class:w-full={$$restProps.fullWidth}
>
	<button class="relative left-full top-4" on:click={handleClose}>
		<Close />
	</button>
	<p class="font-semibold text-neutral-grey-2 text-xl mb-1">Rate your experience</p>
	<p class="font-normal text-neutral-grey-4 text-sm mb-1">
		Your feedback will help us serve you better
	</p>
	<div class="flex flex-row items-center justify-center p-5">
		<button class="mr-2" on:click={handleClick1}>
			<Star color={stars > 0 ? '#F37003' : 'none'} />
		</button>
		<button class="mr-2" on:click={handleClick2}>
			<Star color={stars > 1 ? '#F37003' : 'none'} />
		</button>
		<button class="mr-2" on:click={handleClick3}>
			<Star color={stars > 2 ? '#F37003' : 'none'} />
		</button>
		<button class="mr-2" on:click={handleClick4}>
			<Star color={stars > 3 ? '#F37003' : 'none'} />
		</button>
		<button on:click={handleClick5}>
			<Star color={stars > 4 ? '#F37003' : 'none'} />
		</button>
	</div>
	<div class="flex flex-row items-center justify-center p-3">
		<Button variant="primary" id="Submit" on:click={handleSubmit}>Submit</Button>
	</div>
</div>
