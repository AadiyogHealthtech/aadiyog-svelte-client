<script lang="ts">
	import { goto } from '$app/navigation';
	import Button from '$lib/components/Button/Button.svelte';
	import IconButton from '$lib/components/Button/IconButton.svelte';
	import Advanced from '$lib/icons/AdvancedIcon.svelte';
	import Beginner from '$lib/icons/BeginnerIcon.svelte';
	import Intermediate from '$lib/icons/IntermediateIcon.svelte';

	let selectedAdvanced = false;
	let selectedIntermediate = false;
	let selectedBeginner = false;

	$: selectedAdvanced && advanced();
	$: selectedIntermediate && intermediate();
	$: selectedBeginner && beginner();

	function advanced() {
		selectedIntermediate = false;
		selectedBeginner = false;
	}
	function intermediate() {
		selectedAdvanced = false;
		selectedBeginner = false;
	}
	function beginner() {
		selectedAdvanced = false;
		selectedIntermediate = false;
	}
	function handleClick() {
		goto('/personalization/5');
	}
</script>

<div class="h-screen w-full flex flex-col items-center justify-between px-8 py-8">
	<div class="flex flex-col items-center justify-center">
		<h1 class="text-neutral-grey-3">What is your level in Yoga?</h1>
	</div>
	<div>
		<IconButton id="Advaced" width={32} height={32} rounded={'lg'} bind:selected={selectedAdvanced}>
			<Advanced color={selectedAdvanced ? '#F37003' : '#666666'} />
			<h4 class="text-neutral-grey-3" class:text-primary={selectedAdvanced}>Advanced</h4>
		</IconButton>
		<div class="mt-10">
			<IconButton
				id="Intermediate"
				width={32}
				height={32}
				rounded={'lg'}
				bind:selected={selectedIntermediate}
			>
				<Intermediate color={selectedIntermediate ? '#F37003' : '#333333'} />
				<h4 class="text-neutral-grey-3" class:text-primary={selectedIntermediate}>Intermediate</h4>
			</IconButton>
		</div>
		<div class="mt-10">
			<IconButton
				id="Begineer"
				width={32}
				height={32}
				rounded={'lg'}
				bind:selected={selectedBeginner}
			>
				<Beginner color={selectedBeginner ? '#F37003' : '#333333'} />
				<h4 class="text-neutral-grey-3" class:text-primary={selectedBeginner}>Beginner</h4>
			</IconButton>
		</div>
	</div>
	<Button variant="primary" fullWidth id="Next" on:click={handleClick}>Next</Button>
</div>
