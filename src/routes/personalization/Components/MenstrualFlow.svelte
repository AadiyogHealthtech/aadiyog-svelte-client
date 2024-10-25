<script lang="ts">
	import Button from '$lib/components/Button/Button.svelte';
	import IconButton from '$lib/components/Button/IconButton.svelte';
	import Onboarding2 from '$lib/Images/Onboarding2.png';
	import Irregular from '$lib/icons/IrregularIcon.svelte';
	import Regular from '$lib/icons/RegularIcon.svelte';
	import None from '$lib/icons/NoneIcon.svelte'; // Assuming you have a None icon, or use appropriate icon
	import { goto } from '$app/navigation';
	import { userSignupRequestStore } from '$lib/store/userSignupRequestStore';
	import { MenstrualFlowType } from '$lib/messages/User.msg';

	interface FlowOption {
		id: MenstrualFlowType;
		icon: any;
		label: string;
	}

	const OPTIONS: FlowOption[] = [
		{
			id: MenstrualFlowType.Irregular,
			icon: Irregular,
			label: 'Irregular'
		},
		{
			id: MenstrualFlowType.Regular,
			icon: Regular,
			label: 'Regular'
		},
		{
			id: MenstrualFlowType.NA,
			icon: None,
			label: 'NA'
		}
	];

	// Single source of truth for selection
	$: selectedFlow = $userSignupRequestStore.menstrualFlow;

	function handleSelection(newFlow: MenstrualFlowType) {
		userSignupRequestStore.update((store) => ({
			...store,
			menstrualFlow: newFlow
		}));
	}

	function handleClick() {
		goto('/personalization/9');
	}
</script>

<div class="h-screen w-full flex flex-col items-center justify-between px-8 py-8">
	<div class="flex flex-col items-center justify-center">
		<h1 class="text-neutral-grey-3">How is your menstrual flow?</h1>
	</div>

	<img alt="Onboarding2" src={Onboarding2} />

	<div class="flex flex-row gap-10">
		{#each OPTIONS as option}
			<IconButton
				id={option.label}
				width={24}
				height={24}
				rounded={'lg'}
				selected={selectedFlow === option.id}
				on:change={() => handleSelection(option.id)}
			>
				<svelte:component
					this={option.icon}
					color={selectedFlow === option.id ? '#F37003' : '#666666'}
				/>
				<h4 class="text-neutral-grey-3" class:text-primary={selectedFlow === option.id}>
					{option.label}
				</h4>
			</IconButton>
		{/each}
	</div>

	<Button variant="primary" fullWidth id="Next" on:click={handleClick}>Next</Button>
</div>
