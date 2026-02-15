export interface TermIndex {
	slug: string;
	title: string;
	abbrev?: string;
}

export interface CategoryIndex {
	terms: TermIndex[];
	generatedAt: string;
}

export interface RootIndex {
	categories: {
		path: string;
		name: string;
		description?: string;
		termsCount: number;
		approvers: {
			username: string;
			approveCount: number;
		}[];
		terms: TermIndex[];
	}[];
	generatedAt: string;
}

export interface ArabicWord {
	word: string;
	approvedBy: string[];
}

export interface Term {
	title: string;
	abbrev?: string;
	description: string;
	tags: string[];
	arabicWords: ArabicWord[];
}
