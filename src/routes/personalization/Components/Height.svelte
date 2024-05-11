<script lang="ts">
	import Button from '$lib/components/Button/Button.svelte';
</script>

<div class="h-screen w-screen flex flex-col items-center justify-between px-8 py-8">
	<div class="flex flex-col items-center justify-center">
		<h1 class="text-neutral-grey-3">How tall are you?</h1>
	</div>
	<div class="flex flex-row">
		<Button variant="ghost" fullWidth id="ft">ft</Button>
		<div class="ml-10">
			<Button variant="ghost" fullWidth id="cm">cm</Button>
		</div>
	</div>

	<Button variant="primary" fullWidth id="Next">Next</Button>
</div>
