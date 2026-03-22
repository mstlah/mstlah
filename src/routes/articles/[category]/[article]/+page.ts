import type { PageLoad } from "./$types";
import { fetchArticle } from "$repo";
import { marked } from "marked";

export const prerender = false;

export const load: PageLoad = async ({ params }) => {
  const { category, article } = params;
  const content = await fetchArticle(category, article);
  const html = marked.parse(content);

  return { category, article, html };
};
