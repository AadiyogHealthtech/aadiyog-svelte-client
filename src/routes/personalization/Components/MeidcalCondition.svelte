<script lang="ts">
	import Button from '$lib/components/Button/Button.svelte';
	import IconButton from '$lib/components/Button/IconButton.svelte';
	import { goto } from '$app/navigation';
	import { userSignupRequestStore } from '$lib/store/userSignupRequestStore';
	import { MedicalCondition } from '$lib/messages/User.msg';
	import { handelBack } from '$lib/store/navigationStore';
	import Back from '$lib/icons/BackIcon.svelte';
	// Individual icon imports
	import Cholesterol from '$lib/icons/CholesterolIcon.svelte';
	import Diabetes from '$lib/icons/DiabetesIcon.svelte';
	import Heart from '$lib/icons/HeartIcon.svelte';
	import HighBp from '$lib/icons/HighBPIcon.svelte';
	import Inhaler from '$lib/icons/InhalerIcon.svelte';
	import Pcos from '$lib/icons/PCOSIcon.svelte';
	import Spine from '$lib/icons/SpineIcon.svelte';
	import Thyroid from '$lib/icons/ThyroidIcon.svelte';
	import None from '$lib/icons/NoneIcon.svelte';
	import Gender from './Gender.svelte';

	const ICONS = {
		Inhaler,
		Cholesterol,
		Diabetes,
		Heart,
		HighBp,
		Pcos,
		Spine,
		Thyroid,
		None
	} as const;

	interface ConditionConfig {
		id: MedicalCondition;
		label: string;
		icon: keyof typeof ICONS;
	}

	const CONDITIONS: ConditionConfig[] = [
		{ id: MedicalCondition.Inhaler, label: 'Inhaler', icon: 'Inhaler' },
		{ id: MedicalCondition.Cholesterol, label: 'Cholesterol', icon: 'Cholesterol' },
		{ id: MedicalCondition.Diabetes, label: 'Diabetes', icon: 'Diabetes' },
		{ id: MedicalCondition.HeartIssue, label: 'Heart issue', icon: 'Heart' },
		{ id: MedicalCondition.PCOS, label: 'PCOS', icon: 'Pcos' },
		{ id: MedicalCondition.Thyroid, label: 'Thyroid', icon: 'Thyroid' },
		{ id: MedicalCondition.HighBP, label: 'High BP', icon: 'HighBp' },
		{ id: MedicalCondition.SpineIssue, label: 'Spine issue', icon: 'Spine' },
		{ id: MedicalCondition.None, label: 'None', icon: 'None' }
	];

	const ITEMS_PER_ROW = 3;

	// Create reactive selections map
	$: selections = CONDITIONS.reduce(
		(acc, condition) => {
			acc[condition.id] = $userSignupRequestStore.medicalConditions.includes(condition.id);
			return acc;
		},
		{} as Record<MedicalCondition, boolean>
	);

	function handleConditionChange(condition: MedicalCondition, isSelected: boolean) {
		userSignupRequestStore.update((store) => {
			let updatedConditions: MedicalCondition[];

			if (isSelected) {
				if (condition === MedicalCondition.None) {
					updatedConditions = [MedicalCondition.None];
				} else {
					updatedConditions = store.medicalConditions
						.filter((c) => c !== MedicalCondition.None && c !== condition)
						.concat(condition);
				}
			} else {
				updatedConditions = store.medicalConditions.filter((c) => c !== condition);
			}

			return {
				...store,
				medicalConditions: updatedConditions
			};
		});
	}

	function handleNext() {
		goto('/personalization/8');
	}

	// Split conditions into rows
	$: rows = CONDITIONS.reduce((acc, _, index) => {
		if (index % ITEMS_PER_ROW === 0) {
			acc.push(CONDITIONS.slice(index, index + ITEMS_PER_ROW));
		}
		return acc;
	}, [] as ConditionConfig[][]);
</script>

<div class="h-screen w-full flex flex-col items-center justify-between px-4 py-8">
	<div class="px-8 flex flex-row items-center justify-center">
		<button class="absolute top-9 left-8" on:click={handelBack}>
			<Back />
		</button>
	</div>
	<h1 class="text-neutral-grey-3">Do you have any medical condition?</h1>

	<div class="flex flex-col gap-10">
		{#each rows as row}
			<div class="flex flex-row gap-10">
				{#each row as condition}
					<IconButton
						id={condition.label}
						width={24}
						height={24}
						rounded="lg"
						selected={selections[condition.id]}
						on:change={(e) => handleConditionChange(condition.id, e.detail)}
					>
						<svelte:component
							this={ICONS[condition.icon]}
							color={selections[condition.id] ? '#F37003' : '#666666'}
						/>
						<h4 class="text-neutral-grey-3" class:text-primary={selections[condition.id]}>
							{condition.label}
						</h4>
					</IconButton>
				{/each}
			</div>
		{/each}
	</div>

	<Button variant="primary" fullWidth id="Next" on:click={handleNext}>Next</Button>
</div>
