<script lang="ts">
	import { onMount } from 'svelte';
	import '../app.css';
	import { validateSession } from '$lib/utils/helpers/misc.helper';
	onMount(() => {
		validateSession();
	});
</script>

<slot />
