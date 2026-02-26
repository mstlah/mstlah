<script lang="ts">
	import { onMount } from "svelte";

	let isDark = $state(true);

	onMount(() => {
		const saved = localStorage.getItem("theme");
		if (saved) {
			isDark = saved === "dark";
		} else {
			isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
		}
		applyTheme();
	});

	function applyTheme() {
		if (isDark) {
			document.documentElement.classList.remove("light");
		} else {
			document.documentElement.classList.add("light");
		}
	}

	function toggle() {
		isDark = !isDark;
		localStorage.setItem("theme", isDark ? "dark" : "light");
		applyTheme();
	}
</script>

<button class="theme-toggle" onclick={toggle} aria-label={isDark ? "تبديل للوضع الفاتح" : "تبديل للوضع الداكن"}>
	{#if isDark}
		<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<circle cx="12" cy="12" r="5"></circle>
			<line x1="12" y1="1" x2="12" y2="3"></line>
			<line x1="12" y1="21" x2="12" y2="23"></line>
			<line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
			<line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
			<line x1="1" y1="12" x2="3" y2="12"></line>
			<line x1="21" y1="12" x2="23" y2="12"></line>
			<line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
			<line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
		</svg>
	{:else}
		<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
		</svg>
	{/if}
</button>

<style>
	.theme-toggle {
		position: fixed;
		top: 1rem;
		right: 1rem;
		background: var(--color-bg-alt);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		padding: 0.5rem;
		cursor: pointer;
		color: var(--color-text);
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background 0.2s, color 0.2s;
		z-index: 100;
	}

	.theme-toggle:hover {
		background: var(--color-accent);
		color: var(--color-bg);
	}
</style>
