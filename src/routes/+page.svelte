<script lang="ts">
	import BottomTabBar from '$lib/components/Button/BottomTabBar.svelte';
	import Button from '$lib/components/Button/Button.svelte';
	import MedicalCondition from '$lib/components/Button/MedicalCondition.svelte';
	import Plan from '$lib/components/Button/Plan.svelte';
	import Rating from '$lib/components/Button/Rating.svelte';
	import TextFeild from '$lib/components/Button/TextFeild.svelte';
	import Toggle from '$lib/components/Button/Toggle.svelte';
	import Inhaler from '$lib/icons/Inhaler.svelte';
	import '../app.css';

	let selected = false;
</script>

<div class="bg-white flex flex-col p-80">
	<Button variant="secondary" id="One">BUTTON</Button>

	<MedicalCondition bind:selected id="one">
		<Inhaler color={selected ? '#F37003' : '#333333'} />
		Asthma
	</MedicalCondition>

	<Toggle variant="selected" id="One"></Toggle>

	<TextFeild inputName="Textfield/Active" placeholder="Textfield text" id="One" />

	<Rating inputName="Textfield/Active" placeholder="Textfield text" id="One" />

	<Plan id="One" />

	<BottomTabBar id="One" />
</div>
