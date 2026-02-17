import type { PageData, PageLoad } from "./$types.ts";

export const load: PageLoad = ({ params }: PageData) => {
	const { category, slug } = params;

	return { category, slug };
};
