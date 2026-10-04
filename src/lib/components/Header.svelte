<script lang="ts">
	import { resolve } from "$app/paths";

	const { size, pos } = $props();
	const align = pos === "right" ? "right" : "center";
	const margin = size === "small" ? "5em 4em" : "5em 6em";
	const fontSize = size === "small" ? "4.5em" : "7em";
</script>

<header
	class="header"
	style:--header-margin-block={margin}
	style:text-align={align}
>
	<div class="logo-wrap" style:font-size={fontSize}>
		<a href={resolve("/")} class="logo">
			مصطلح
		</a>
		<span class="proto-chip">نموذج</span>
	</div>
</header>

<style>
	.header {
		width: min(clamp(600px, 70%, 80vw), 100%);
		text-align: center;
		margin: 0 auto;
		margin-block: var(--header-margin-block, 5em 6em);
	}

	@media (max-width: 600px) {
		/* top margin stays 5em: the fixed .controls sit in that band on the
		   pos="right" pages, where the logo is flush to the inline-start edge */
		.header {
			margin-block: 5em 3em;
		}
	}

	/* inline-flex keeps the header's text-align in charge of placement */
	.logo-wrap {
		display: inline-flex;
		flex-direction: row;
		align-items: baseline;
	}

	.proto-chip {
		margin-inline-start: 0;
		padding-block: 0.1em;
		padding-inline: 0.55em;
		font-family: var(--font-display);
		font-size: clamp(0.62rem, 0.1em, 0.68rem);
		line-height: 1;
		font-weight: 500;
		letter-spacing: 0.04em;
		color: var(--color-text-secondary);
		background: none;
		border-radius: var(--radius-sm);
		opacity: 0.55;
		user-select: none;
		pointer-events: none;
		text-decoration: underline;
		margin-top: auto;
	}

	.logo {
		font-family: var(--font-display);
		font-size: 1em;
		font-weight: 700;
		color: var(--color-fg);
		letter-spacing: -0.02em;
	}
</style>
