import type { PageLoad } from "./$types";
import { fetchArticle } from "$repo";
import { marked } from "marked";
import { resolve } from "$app/paths";

const renderer = {
  link({ href, text }: { href: string; text: string }) {
    if (href.startsWith("/") && !href.startsWith("//")) {
      href = resolve(href);
    }
    return `<a href="${href}">${text}</a>`;
  },
};

marked.use({ renderer });

export const prerender = false;

export const load: PageLoad = async ({ params }) => {
  const { category, article } = params;
  const content = await fetchArticle(category, article);
  const html = await marked.parse(content);

  return { category, article, html };
};
