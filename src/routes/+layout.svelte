<script lang="ts">
	import "$lib/assets/styles.css";
	const { children } = $props();
</script>

<main class="main">
	{@render children()}
</main>

<style>
	.main {
		display: flex;
		flex-direction: column;
		width: clamp(600px, 90%, 80vw);
		margin: 0 auto;
		height: 100vh;
	}
</style>
