<script lang="ts">
	import { goto } from "$app/navigation";
	import Header from "$lib/components/Header.svelte";
	import type { PageProps } from "./$types";
	import { resolve } from "$app/paths";

	let { data }: PageProps = $props();
</script>

<svelte:body
	onkeydown={(event: KeyboardEvent) => {
		if (event.key !== "Escape") {
			return;
		}

		goto(resolve("/articles"));
	}}
/>

<Header size="small" pos="right" />

<div class="article-page">
	<a href={resolve("/articles")} class="back" id="backBtn">
		<svg
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
		>
			<path d="m9 18 6-6-6-6" />
		</svg>
	</a>

	<article class="content">
		{@html data.html}
	</article>
</div>

<style>
	.article-page {
		width: clamp(600px, 60%, 80vw);
		margin: 0 auto;
		padding: 2rem 1rem;
	}

	.back {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		background: var(--color-bg);
		border-radius: 50%;
		margin-bottom: 1rem;
	}

	.content {
		font-family: var(--font-arabic);
		direction: rtl;
		line-height: 1.8;
	}

	.content :global(h1) {
		font-size: 2rem;
		margin-bottom: 1rem;
	}

	.content :global(h2) {
		font-size: 1.5rem;
		margin-top: 2rem;
		margin-bottom: 0.75rem;
	}

	.content :global(p) {
		margin-bottom: 1rem;
	}

	.content :global(a) {
		color: var(--color-accent);
	}

	.content :global(code) {
		background: var(--color-bg);
		padding: 0.2rem 0.4rem;
		border-radius: 4px;
		font-family: var(--font-english);
	}

	.content :global(pre) {
		background: var(--color-bg);
		padding: 1rem;
		border-radius: 8px;
		overflow-x: auto;
	}

	.content :global(pre code) {
		background: none;
		padding: 0;
	}
</style>
