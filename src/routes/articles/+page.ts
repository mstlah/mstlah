import type { PageLoad } from "./$types";
import { fetchArticlesIndex } from "$repo";

export const prerender = false;

export const load: PageLoad = async () => {
  const articlesIndex = await fetchArticlesIndex();
  return { articlesIndex };
};
