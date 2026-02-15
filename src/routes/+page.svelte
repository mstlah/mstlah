<script lang="ts">
	import { goto } from "$app/navigation";
	import { fetchRootIndex } from "$repo";

	let categories = $state<
		{
			categoryName: string;
			title: string;
			categoryPath: string;
			slug: string;
		}[]
	>([]);

	let searchPattern = $state<string>("");

	function navigateToTerm(categoryPath: string, slug: string) {
		goto(`/${categoryPath}/${slug}`, { replaceState: false });
	}

	function handleSearch(event: KeyboardEvent) {
		if (event.key !== "Enter") {
			return;
		}

		if (filteredCategories.length < 1) {
			return;
		}

		const first = filteredCategories[0];
		navigateToTerm(first.categoryPath, first.slug);
	}

	$effect(() => {
		(async () => {
			const index = await fetchRootIndex();
			const out = [];
			for (const category of index.categories) {
				for (const term of category.terms) {
					out.push({
						categoryName: category.name,
						categoryPath: category.path,
						slug: term.slug,
						title: term.title,
					});
				}
			}
			categories = out;
		})();
	});

	let filteredCategories = $derived.by(() => {
		if (!searchPattern) {
			return [];
		}

		const items = [];

		for (const entry of categories) {
			if (entry.title.toLowerCase().includes(searchPattern.toLowerCase())) {
				items.push(entry);
			}
		}

		return items;
	});
</script>

<div class="search-wrapper">
	<div class="search-input-box">
		<input
			type="text"
			class="search-input"
			placeholder="Search..."
			autocomplete="off"
			id="searchInput"
			bind:value={searchPattern}
			onkeydown={handleSearch}
		/>

		<svg
			class="search-icon"
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<circle cx="11" cy="11" r="8"></circle>
			<path d="m21 21-4.3-4.3"></path>
		</svg>
	</div>

	{#if filteredCategories.length}
		<div id="suggestions" class="suggestions">
			{#each filteredCategories as entry}
				<div
					class="suggestion"
					onclick={() => navigateToTerm(entry.categoryPath, entry.slug)}
				>
					<div class="suggestion-title">{entry.title}</div>
					<div class="suggestion-category">{entry.categoryName}</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.search-input {
		width: 100%;
		padding: 1.25rem;
		font-size: 1.25rem;
		border: none;
		border-radius: var(--radius-lg);
		background: var(--color-card);
		transition: box-shadow 0.2s ease;
		font-family: var(--font-english);
		direction: ltr;
		text-align: left;
		color: var(--color-text);
	}

	.search-input:focus {
		outline: none;
		box-shadow: none;
	}

	.search-input::placeholder {
		color: var(--color-text-muted);
	}

	.search-icon {
		position: absolute;
		right: 1rem;
		top: 50%;
		transform: translateY(-50%);
		color: var(--color-text-secondary);
		pointer-events: none;
	}

	.search-wrapper {
		display: flex;
		flex-direction: column;
		width: clamp(600px, 60%, 80vw);
		margin: 0 auto;

		@media (max-width: 600px) {
			padding: 0.8rem;
		}

		& .search-input-box {
			width: 100%;
			margin: 0 auto;
			position: relative;

			direction: ltr;
			text-align: left;
			margin-bottom: 1rem;
		}
	}

	.suggestions {
		direction: ltr;
		width: 100%;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		z-index: 10;
		max-height: 400px;
		gap: 1rem;
		overflow-y: auto;
		background: var(--color-card);
	}

	.suggestion {
		padding: 1rem;
		cursor: pointer;

		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.suggestion-title {
		font-family: var(--font-english);
	}

	.suggestion-category {
		font-family: var(--font-arabic);
		font-size: 0.5rem;
		background: var(--color-suggestion-bg);
		color: var(--color-suggestion-text);
		padding: 0.2rem 0.5rem;
	}

	.suggestions::-webkit-scrollbar {
		display: none;
	}

	.suggestions {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
</style>
