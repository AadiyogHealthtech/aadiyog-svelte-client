<script lang="ts">
	import Button from '$lib/components/Button/Button.svelte';
	import YogaIllustration from '$lib/Images/YogaIllustration.png';
</script>

<div class="h-screen w-screen flex flex-col items-center justify-between px-8 py-8">
	<div class="flex flex-col items-center justify-center">
		<h1 class="text-neutral-grey-3">What is your weight?</h1>
	</div>
	<img alt="YogaIllustration" src={YogaIllustration} />

	<Button variant="primary" fullWidth id="Next">Next</Button>
</div>
