import type { ArticlesIndex, CategoryIndex, RootIndex, Term } from "../types.ts";

console.log("Using local repos");

const API_PATH = "/dictionary/api/v1";
const TERMS_PATH = "/dictionary/terms";
const ARTICLES_PATH = "/articles";

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

export async function fetchTerm(category: string, term: string): Promise<Term> {
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

export async function fetchCategoryMeta(
  category: string,
): Promise<CategoryMeta> {
  try {
    const response = await fetch(`${API_PATH}/${category}/meta.json`);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch category meta: ${response.status} ${response.statusText}`,
      );
    }
    return response.json();
  } catch (error: unknown) {
    return {
      name: category,
    };
  }
}

export async function fetchArticle(
  category: string,
  article: string,
): Promise<string> {
  const response = await fetch(`${ARTICLES_PATH}/${category}/${article}.md`);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch article "${article}": ${response.status} ${response.statusText}`,
    );
  }
  return response.text();
}

export async function fetchArticlesIndex(): Promise<ArticlesIndex> {
  const response = await fetch(`${ARTICLES_PATH}/index.json`);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch articles index: ${response.status} ${response.statusText}`,
    );
  }
  return response.json();
}
