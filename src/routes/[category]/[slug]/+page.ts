import type { PageData, PageLoad } from "./$types";


export const load: PageLoad = async ({ params }: PageData) => {
	const { category, slug } = params;

	return { category, slug };
};
