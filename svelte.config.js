import process from "node:process";
import adapter from "@sveltejs/adapter-static";

const base = process.env.BASE_PATH;

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		// adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
		// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
		// See https://svelte.dev/docs/kit/adapters for more information about adapters.
		adapter: adapter({
			pages: "build",
			assets: "build",
			fallback: "404.html",
			precompress: false,
			strict: true,
		}),
		prerender: {
			entries: [`/`, `/[category]/[slug]`],
		},
		paths: {
			base: process.argv.includes("dev") ? "" : base,
		},
		alias: {
			$repo: process.argv.includes("dev")
				? "./src/lib/repos/local"
				: "./src/lib/repos/github",
		},
	},
};

export default config;
