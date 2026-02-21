import type { PageLoad } from "./$types";

export const load: PageLoad = ({ params, url }) => {
	const { category } = params;
	const slug = url.searchParams.get("term");

	return { category, slug };
};
