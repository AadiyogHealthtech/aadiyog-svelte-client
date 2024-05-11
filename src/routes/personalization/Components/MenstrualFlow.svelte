<script lang="ts">
	import Button from '$lib/components/Button/Button.svelte';
	import IconButton from '$lib/components/Button/IconButton.svelte';
	import Onboarding2 from '$lib/Images/Onboarding2.png';
	import Irregular from '$lib/icons/Irregular.svelte';
	import Regular from '$lib/icons/Regular.svelte';

	let selectedIrregular = false;
	let selectedRegular = false;

	$: selectedIrregular && female();
	$: selectedRegular && male();

	function female() {
		selectedRegular = false;
	}
	function male() {
		selectedIrregular = false;
	}
</script>

<div class="h-screen w-screen flex flex-col items-center justify-between px-8 py-8">
	<div class="flex flex-col items-center justify-center">
		<h1 class="text-neutral-grey-3">How is your menstrual flow?</h1>
	</div>

	<img alt="Onboarding2" src={Onboarding2} />

	<div class="flex flex-row">
		<IconButton id="Female" width={20} height={20} rounded={'lg'} bind:selected={selectedIrregular}>
			<Irregular color={selectedIrregular ? '#F37003' : '#666666'} />
			<h4 class="text-neutral-grey-3" class:text-primary={selectedIrregular}>Irregular</h4>
		</IconButton>
		<div class="ml-10">
			<IconButton id="Male" width={20} height={20} rounded={'lg'} bind:selected={selectedRegular}>
				<Regular color={selectedRegular ? '#F37003' : '#333333'} />
				<h4 class="text-neutral-grey-3" class:text-primary={selectedRegular}>Regular</h4>
			</IconButton>
		</div>
	</div>

	<Button variant="primary" fullWidth id="Next">Next</Button>
</div>
