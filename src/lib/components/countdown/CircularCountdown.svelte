<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

	export let startValue: number = 5;
	export let radius: number = 5;
	export let color: string = 'blue';

	let countdown = startValue;
	let circumference = 2 * Math.PI * radius;
	let interval: ReturnType<typeof setInterval>;

	$: dashOffset = circumference - (countdown / startValue) * circumference;

	onMount(() => {
		interval = setInterval(() => {
			if (countdown > 0) {
				countdown--;
			} else {
				clearInterval(interval);
			}
		}, 1000);
	});

	onDestroy(() => {
		clearInterval(interval);
	});
</script>

<svg width="{radius * 2 + 20}" height="{radius * 2 + 20}" class="relative">
	<circle
		cx="{radius + 10}"
		cy="{radius + 10}"
		r="{radius}"
		stroke="gray"
		stroke-width="3"
		fill="none"
	></circle>

	<circle
		cx="{radius + 10}"
		cy="{radius + 10}"
		r="{radius}"
		stroke="{color}"
		stroke-width="3"
		fill="none"
		stroke-dasharray="{circumference}"
		stroke-dashoffset="{dashOffset}"
		style="transition: stroke-dashoffset 1s linear"
	></circle>

	<text
		x="50%"
		y="50%"
		dy=".3em"
		text-anchor="middle"
		font-size="1rem"
		fill="black"
	>
		{countdown}
	</text>
</svg>
