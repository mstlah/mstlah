import type { CategoryIndex, RootIndex, Term } from "../types.ts";

const API_PATH = "/dictionary/api/v1";
const TERMS_PATH = "/dictionary/terms";


export async function fetchRootIndex(): Promise<RootIndex> {
	const response = await fetch(`${API_PATH}/categories.json`);
	if (!response.ok) {
		throw new Error(
			`Failed to fetch root index: ${response.status} ${response.statusText}`,
		);
	}
	return response.json();
}

export async function fetchCategoryIndex(
	category: string,
): Promise<CategoryIndex> {
	const response = await fetch(`${API_PATH}/${category}/index.json`);
	if (!response.ok) {
		throw new Error(
			`Failed to fetch category ${category}: ${response.status} ${response.statusText}`,
		);
	}
	const data = await response.json();
	const terms = Array.isArray(data) ? data : data.terms || [];
	const generatedAt = data.generatedAt || new Date().toISOString();
	return { terms, generatedAt };
}

export async function fetchTerm(
	category: string,
	term: string,
): Promise<Term> {
	const response = await fetch(`${TERMS_PATH}/${category}/${term}.md`);
	if (!response.ok) {
		throw new Error(
			`Failed to fetch term "${term}": ${response.status} ${response.statusText}`,
		);
	}
	const content = await response.text();
	const { parseMarkdown } = await import("../md-parser.ts");
	return parseMarkdown(content);
}
