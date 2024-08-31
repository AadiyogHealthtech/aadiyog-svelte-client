<script lang="ts">
	import Button from '$lib/components/Button/Button.svelte';
	import IconButton from '$lib/components/Button/IconButton.svelte';
	import Onboarding2 from '$lib/Images/Onboarding2.png';
	import Irregular from '$lib/icons/IrregularIcon.svelte';
	import Regular from '$lib/icons/RegularIcon.svelte';
	import { goto } from '$app/navigation';
	import { userSignupRequestStore } from '$lib/store/userSignupRequestStore';
	import { MenstrualFlowType } from '$lib/messages/User.msg';

	// tInitialize selected states based on the store
	let selectedIrregular = $userSignupRequestStore.menstrualFlow === MenstrualFlowType.Irregular;
	let selectedRegular = $userSignupRequestStore.menstrualFlow === MenstrualFlowType.Regular;

	$: selectedIrregular && female();
	$: selectedRegular && male();

	function female() {
		selectedRegular = false;
	}
	function male() {
		selectedIrregular = false;
	}

	function handleClick() {
		$userSignupRequestStore = {
			...$userSignupRequestStore,
			menstrualFlow: selectedIrregular ? MenstrualFlowType.Irregular : MenstrualFlowType.Regular
		};
		goto('/personalization/9');
	}
</script>

<div class="h-screen w-full flex flex-col items-center justify-between px-8 py-8">
	<div class="flex flex-col items-center justify-center">
		<h1 class="text-neutral-grey-3">How is your menstrual flow?</h1>
	</div>

	<img alt="Onboarding2" src={Onboarding2} />

	<div class="flex flex-row">
		<IconButton
			id="Irregular"
			width={24}
			height={24}
			rounded={'lg'}
			bind:selected={selectedIrregular}
		>
			<Irregular color={selectedIrregular ? '#F37003' : '#666666'} />
			<h4 class="text-neutral-grey-3" class:text-primary={selectedIrregular}>Irregular</h4>
		</IconButton>
		<div class="ml-10">
			<IconButton
				id="Regular"
				width={24}
				height={24}
				rounded={'lg'}
				bind:selected={selectedRegular}
			>
				<Regular color={selectedRegular ? '#F37003' : '#333333'} />
				<h4 class="text-neutral-grey-3" class:text-primary={selectedRegular}>Regular</h4>
			</IconButton>
		</div>
	</div>

	<Button variant="primary" fullWidth id="Next" on:click={handleClick}>Next</Button>
</div>
