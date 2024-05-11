<script lang="ts">
	import Button from '$lib/components/Button/Button.svelte';
	import IconButton from '$lib/components/Button/IconButton.svelte';
	import Female from '$lib/icons/Female.svelte';
	import Male from '$lib/icons/Male.svelte';

	let selectedFemale = false;
	let selectedMale = false;

	$: selectedFemale && female();
	$: selectedMale && male();

	function female() {
		selectedMale = false;
	}
	function male() {
		selectedFemale = false;
	}
</script>

<div class="h-screen w-screen flex flex-col items-center justify-between px-8 py-8">
	<div class="flex flex-col items-center justify-center">
		<h1 class="text-neutral-grey-3">What is your gender?</h1>
		<h3 class="text-neutral-grey-4">Help us recommend you personalized courses</h3>
	</div>
	<div>
		<IconButton id="Female" width={20} height={20} rounded={'lg'} bind:selected={selectedFemale}>
			<Female color={selectedFemale ? '#F37003' : '#666666'} />
			<h4 class="text-neutral-grey-3" class:text-primary={selectedFemale}>Female</h4>
		</IconButton>
		<div class="mt-10">
			<IconButton id="Male" width={20} height={20} rounded={'lg'} bind:selected={selectedMale}>
				<Male color={selectedMale ? '#F37003' : '#333333'} />
				<h4 class="text-neutral-grey-3" class:text-primary={selectedMale}>Male</h4>
			</IconButton>
		</div>
	</div>
	<Button variant="primary" fullWidth id="Next">Next</Button>
</div>
