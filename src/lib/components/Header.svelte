<script lang="ts">
	const { size, pos } = $props();
	const align = pos === "right" ? "right" : "center";
	const margin = size === "small" ? "5rem 10rem" : "5rem 15rem";
	const fontSize = size === "small" ? "4.5rem" : "7rem";
</script>

<header class="header" style:text-align={align} style:margin-block={margin}>
	<h1 class="logo" style:font-size={fontSize}>مصطلح</h1>
</header>

<style>
	.header {
		width: clamp(600px, 70%, 80vw);
		text-align: center;
		margin: 0 auto;
		margin-block: 5rem 12rem;
		text-shadow: 0 0 5px var(--color-text);
	}

	.logo {
		font-family: var(--font-display);
		font-size: 7rem;
		font-weight: 700;
		color: var(--color-fg);
		letter-spacing: -0.02em;
	}
</style>
