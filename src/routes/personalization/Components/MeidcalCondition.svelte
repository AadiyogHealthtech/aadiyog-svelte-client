<script lang="ts">
	import Button from '$lib/components/Button/Button.svelte';
	import IconButton from '$lib/components/Button/IconButton.svelte';
	import Cholesterol from '$lib/icons/CholesterolIcon.svelte';
	import Diabetes from '$lib/icons/DiabetesIcon.svelte';
	import Heart from '$lib/icons/HeartIcon.svelte';
	import HighBp from '$lib/icons/HighBPIcon.svelte';
	import Inhaler from '$lib/icons/InhalerIcon.svelte';
	import Pcos from '$lib/icons/PCOSIcon.svelte';
	import Spine from '$lib/icons/SpineIcon.svelte';
	import Thyroid from '$lib/icons/ThyroidIcon.svelte';
	import None from '$lib/icons/NoneIcon.svelte';
	import { goto } from '$app/navigation';

	let selectedInhaler = false;
	let selectedCholesterol = false;
	let selectedDiabetes = false;

	let selectedHeartIssue = false;
	let selectedPCOS = false;
	let selectedThyroid = false;

	let selectedHighBP = false;
	let selectedSpineIssue = false;
	let selectedNone = false;

	function handleClick() {
		goto('/personalization/8');
	}
</script>

<div class="h-screen w-full flex flex-col items-center justify-between px-4 py-8">
	<div class="flex flex-col items-center justify-center">
		<h1 class="text-neutral-grey-3">Do you have any medical condition?</h1>
	</div>
	<div>
		<div class="flex flex-row">
			<IconButton
				id="Inhaler"
				width={24}
				height={24}
				rounded={'lg'}
				bind:selected={selectedInhaler}
			>
				<Inhaler color={selectedInhaler ? '#F37003' : '#666666'} />
				<h4 class="text-neutral-grey-3" class:text-primary={selectedInhaler}>Inhaler</h4>
			</IconButton>

			<div class="ml-10">
				<IconButton
					id="Cholesterol"
					width={24}
					height={24}
					rounded={'lg'}
					bind:selected={selectedCholesterol}
				>
					<Cholesterol color={selectedCholesterol ? '#F37003' : '#333333'} />
					<h4 class="text-neutral-grey-3" class:text-primary={selectedCholesterol}>Cholesterol</h4>
				</IconButton>
			</div>
			<div class="ml-10">
				<IconButton
					id="Diabetes"
					width={24}
					height={24}
					rounded={'lg'}
					bind:selected={selectedDiabetes}
				>
					<Diabetes color={selectedDiabetes ? '#F37003' : '#333333'} />
					<h4 class="text-neutral-grey-3" class:text-primary={selectedDiabetes}>Diabetes</h4>
				</IconButton>
			</div>
		</div>

		<div class="flex flex-row mt-10">
			<IconButton
				id="Heart issue"
				width={24}
				height={24}
				rounded={'lg'}
				bind:selected={selectedHeartIssue}
			>
				<Heart color={selectedHeartIssue ? '#F37003' : '#666666'} />
				<h4 class="text-neutral-grey-3" class:text-primary={selectedHeartIssue}>Heart issue</h4>
			</IconButton>
			<div class="ml-10">
				<IconButton id="PCOS" width={24} height={24} rounded={'lg'} bind:selected={selectedPCOS}>
					<Pcos color={selectedPCOS ? '#F37003' : '#333333'} />
					<h4 class="text-neutral-grey-3" class:text-primary={selectedPCOS}>PCOS</h4>
				</IconButton>
			</div>
			<div class="ml-10">
				<IconButton
					id="Thyroid"
					width={24}
					height={24}
					rounded={'lg'}
					bind:selected={selectedThyroid}
				>
					<Thyroid color={selectedThyroid ? '#F37003' : '#333333'} />
					<h4 class="text-neutral-grey-3" class:text-primary={selectedThyroid}>Thyroid</h4>
				</IconButton>
			</div>
		</div>

		<div class="flex flex-row mt-10">
			<IconButton id="High BP" width={24} height={24} rounded={'lg'} bind:selected={selectedHighBP}>
				<HighBp color={selectedHighBP ? '#F37003' : '#666666'} />
				<h4 class="text-neutral-grey-3" class:text-primary={selectedHighBP}>High BP</h4>
			</IconButton>
			<div class="ml-10">
				<IconButton
					id="Spine issue"
					width={24}
					height={24}
					rounded={'lg'}
					bind:selected={selectedSpineIssue}
				>
					<Spine color={selectedSpineIssue ? '#F37003' : '#333333'} />
					<h4 class="text-neutral-grey-3" class:text-primary={selectedSpineIssue}>Spine issue</h4>
				</IconButton>
			</div>
			<div class="ml-10">
				<IconButton id="None" width={24} height={24} rounded={'lg'} bind:selected={selectedNone}>
					<None color={selectedNone ? '#F37003' : '#333333'} />
					<h4 class="text-neutral-grey-3" class:text-primary={selectedNone}>None</h4>
				</IconButton>
			</div>
		</div>
	</div>

	<Button variant="primary" fullWidth id="Next" on:click={handleClick}>Next</Button>
</div>
