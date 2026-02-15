<script lang="ts">
	import { goto } from "$app/navigation";
	import { fetchTerm } from "$repo";
	import { type ArabicWord } from "$lib/types";
	import type { PageProps } from "./$types";

	let { params }: PageProps = $props();

	const s = fetchTerm(params.category, params.slug);
</script>

<svelte:body
	onkeydown={(event: KeyboardEvent) => {
		if (event.key !== "Escape") {
			return;
		}

		goto("/", { replaceState: false });
	}}
/>

{#snippet arabicWordCard(term: ArabicWord)}
	<div class="arabic-word-card">
		<div class="arabic-word">
			{term.word}
		</div>
		<div class="approvers">
			{#each term.approvedBy as approver}
				<div class="approver">
					<a href="https://github.com/{approver}">
						{approver}
					</a>
				</div>
			{/each}
		</div>
	</div>
{/snippet}

{#snippet tag(tags: string[])}
	{#each tags as tag}
		<div class="tag">
			{tag}
		</div>
	{/each}
{/snippet}

{#await s}
	<div class="loading">Loading...</div>
{:then term}
	<div class="term-page">
		<a href="/" class="term-page-back" id="backBtn">
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

		<div class="container">
			<div class="title">
				<div class="full">{term.title}</div>
				<div class="short">{term.abbrev}</div>
			</div>
			<div class="content">
				<div class="tags">
					{@render tag(term.tags)}
				</div>
				<div class="description">{term.description}</div>
				<div class="arabic-words">
					{#each term.arabicWords as aw}
						{@render arabicWordCard(aw)}
					{/each}
				</div>
			</div>
		</div>
	</div>
{:catch error}
	<div class="loading">Error: {error.message}</div>
{/await}

<style>
	.term-page {
		display: flex;
		flex-direction: column;

		width: clamp(600px, 60%, 80vw);
		margin: 0 auto;
		flex: 1;
	}

	@media (max-width: 600px) {
		.term-page {
			padding: 0.8rem;
		}
	}

	.container {
	}

	.container .title {
		direction: ltr;
		display: flex;
		align-items: baseline;
		font-family: var(--font-english);

		& .full {
			font-size: 2.5rem;
		}

		& .short {
			font-size: 0.8rem;
			opacity: 0.8;
		}
	}

	.container .content {
		display: flex;
		flex-direction: column;
		margin-top: 50px;

		& .tags {
			display: flex;
			gap: 0.5rem;

			.tag {
				padding: 0.15rem 0.5rem;
				background: var(--color-tag);
				color: var(--color-tag-text);
				font-size: 0.5rem;
			}
		}

		& .description {
			margin-top: 10px;
			color: var(--color-text-secondary);
		}

		& .arabic-words {
			margin-top: 50px;
			display: flex;
			flex-direction: column;
			gap: 10px;

			.arabic-word-card {
				background: var(--color-bg);
				padding: 0.4rem;
				display: flex;
				flex-direction: column;
				gap: 2px;

				& .arabic-word {
					font-size: 1.5rem;
					font-weight: bold;
				}

				& .approvers {
					display: flex;
					align-items: center;
					gap: 3px;
					font-family: var(--font-arabic);

					& .approver {
						cursor: pointer;
						opacity: .5;
						padding: 0 0.5rem;
						font-size: 0.6rem;
						background: var(--color-approver);
						color: var(--color-approver-text);

						&:hover {
							opacity: 1;
						}

					}
				}
			}
		}
	}
</style>
