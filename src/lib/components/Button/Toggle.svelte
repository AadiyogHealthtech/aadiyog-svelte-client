<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';

	interface $$Props extends HTMLAttributes<HTMLInputElement> {
		id: string;
		checked: boolean;
	}

	const BASE_STYLES =
		'relative my-8 w-14 h-8 rounded-full px-1 toggle-el appearance-none bg-neutral-grey-11 checked:bg-primary cursor-pointer transition-all duration-300 ease-out';

	export let checked: boolean = false;
</script>

<input type="checkbox" class="{BASE_STYLES} {$$restProps.class || ''}" bind:checked />

<style>
	.toggle-el::before {
		content: '';
		display: block;
		position: absolute;
		top: 50%;
		left: 4px;
		transform: translate3d(0, -50%, 0);
		width: 1.5rem;
		height: 1.5rem;
		@apply bg-neutral-content;
		border-radius: 50%;
		transition: transform 0.3s;
		box-shadow: 0 5px 8px rgba(0, 0, 0, 0.15);
	}
	.toggle-el:checked::before {
		transform: translate3d(100%, -50%, 0);
	}
</style>
