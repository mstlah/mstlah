import type { PageLoad } from "./$types";


export const load: PageLoad = async ({fetch}) => {

	return {
		title: "مصطلح - قاموس المصطلحات التقنية",
	};
};
