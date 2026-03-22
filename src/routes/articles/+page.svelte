<script lang="ts">
	import { goto } from "$app/navigation";
	import Header from "$lib/components/Header.svelte";
	import type { PageProps } from "./$types";
	import { resolve } from "$app/paths";
	import Loading from "$lib/components/Loading.svelte";

	let { data }: PageProps = $props();
</script>

<svelte:body
	onkeydown={(event: KeyboardEvent) => {
		if (event.key !== "Escape") {
			return;
		}

		goto(resolve("/"));
	}}
/>

<Header size="small" pos="right" />

{#await data.articlesIndex}
	<div class="loading">
		<Loading />
	</div>
{:then articlesIndex}
	<div class="articles-page">
		<a href={resolve("/")} class="back" id="backBtn">
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

		<div class="categories">
			{#each articlesIndex.categories as category}
				<div class="category-section">
					<div class="category-label">{category.path}</div>
					<div class="articles">
						{#each category.articles as article}
							<a
								href={resolve(`/articles/${article.category}/${article.id}`)}
								class="article-link"
							>
								{article.title}
							</a>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	</div>
{:catch error}
	<div class="loading">Error: {error.message}</div>
{/await}

<style>
	.loading {
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
	}

	.articles-page {
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

	.categories {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.category-section {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.category-label {
		font-size: 0.8rem;
		padding: 0 0.8rem;
		background: var(--color-3);
		color: var(--color-tag-text);
		width: fit-content;
	}

	.articles {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.article-link {
		padding: 0.5rem 0.8rem;
		background: var(--color-card);
		transition: background 0.2s;
	}

	.article-link:hover {
		background: var(--color-bg);
	}
</style>
