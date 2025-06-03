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
	import { handelBack } from '$lib/store/navigationStore';
	import Back from '$lib/icons/BackIcon.svelte';
	
	const totalSteps = 7;
	export let currentStep = 6;

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
		goto('/personalization/8');
	}
	function handleSkip() {
		goto('/personalization/9');
	}
</script>

<div class="h-screen w-full flex flex-col items-center justify-between px-8 py-8">
	<div class="w-full flex items-center justify-between relative">
		<button class="absolute top-2 left-0" on:click={handelBack}>
			<Back />
		</button>
		
		<!-- Progress Bar -->
		<div class="flex flex-col items-start w-full px-10 space-y-2 mt-4"> <!-- Added margin-top here -->
			<div class="w-full h-1 bg-gray-200 rounded relative">
				<div
					class="h-full bg-gray-700 rounded transition-all duration-300"
					style="width: {Math.min((currentStep / totalSteps) * 100, 100)}%"
				></div>
			</div>
			<!-- Step Indicator positioned directly below the progress bar, aligned slightly left -->
			<span class="text-sm text-gray-700 ml-2">Step {currentStep}/{totalSteps}</span>
		</div>
		
		<button class="text-sm text-gray-500" on:click={handleSkip}>Skip</button>
	</div>
	<h1 class="absolute top-20 left-25 text-black font-bold mt-8 text-2xl sm:text-3xl">
		How is your menstrual flow?
	</h1>

	<p class="absolute top-40 left-25 text-gray-600 text-base sm:text-xl">
		Let us know you better
	</p>

	<img alt="Onboarding2" src={Onboarding2} />

	<div class="flex flex-row gap-4">
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
