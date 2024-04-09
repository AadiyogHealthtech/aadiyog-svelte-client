<script lang="ts">
	import Button from '$lib/components/Button/Button.svelte';
	import MedicalCondition from '$lib/components/Button/MedicalCondition.svelte';
	import Toggle from '$lib/components/Button/Toggle.svelte';
	import Inhaler from '$lib/icons/Inhaler.svelte';
	import '../app.css';
</script>

<div class="bg-white flex">
	<!-- <Button variant="secondary" id="One">BUTTON</Button> -->

	<!-- <MedicalCondition variant="selected" id="one">
		<Inhaler color={'#F37003'} />
		Asthma
	</MedicalCondition> -->

	<Toggle variant="selected" id="One"></Toggle>
</div>
