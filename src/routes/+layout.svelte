<script lang="ts">
	import "$lib/assets/styles.css";
	const { children } = $props();
</script>

<main class="main">
	<header class="header">
		<h1 class="logo">مصطلح</h1>
	</header>

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

	.header {
		text-align: right;
		width: 100%;
		margin-bottom: 5rem;
		text-shadow: 0 0 1px var(--color-text);
	}

	.logo {
		font-family: var(--font-display);
		font-size: 4rem;
		font-weight: 700;
		color: var(--color-fg);
		letter-spacing: -0.02em;
	}

	.main {
	}
	
</style>
