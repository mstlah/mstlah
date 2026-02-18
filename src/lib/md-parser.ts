/**
 * @fileoverview Markdown parser for Arabic tech terms.
 * Parses markdown files into structured term objects.
 */

import type { Term } from "./types.ts";

type ParsedTerm = Term;
type ArabicWord = ParsedTerm["arabicWords"][number];

enum SectionState {
	None,
	Description,
	Tags,
	ArabicWords,
	ApprovedBy,
	Unknown,
}

export function parseMarkdown(content: string): Term {
	if (typeof content !== "string") {
		throw new Error("Content must be a string");
	}

	const lines = content.split("\n");

	const result: ParsedTerm = {
		title: "",
		abbrev: "",
		description: "",
		tags: [],
		arabicWords: [],
	};

	let currentSection: SectionState = SectionState.None;
	let currentArabicWord: ArabicWord | null = null;
	let titleFound = false;

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const trimmed = line.trim();

		if (!trimmed && currentSection !== SectionState.Description) {
			continue;
		}

		if (!titleFound && trimmed.startsWith("# ") && !trimmed.startsWith("## ")) {
			const match = trimmed.match(/^# (.+?)(?:\s*\(([^)]+)\))?$/);
			if (match) {
				result.title = match[1].trim();
				result.abbrev = match[2] || "";
				titleFound = true;
			}
			currentSection = SectionState.None;
			continue;
		}

		if (trimmed === "## Description") {
			currentSection = SectionState.Description;
			result.description = "";
			continue;
		}

		if (trimmed === "## Tags") {
			currentSection = SectionState.Tags;
			continue;
		}

		if (trimmed === "# Arabic Words") {
			currentSection = SectionState.ArabicWords;
			continue;
		}

		if (
			trimmed.startsWith("## ") &&
			(currentSection === SectionState.ArabicWords || currentSection === SectionState.ApprovedBy)
		) {
			currentArabicWord = {
				word: trimmed.replace("## ", "").trim(),
				approvedBy: [],
			} as ArabicWord;
			result.arabicWords.push(currentArabicWord);
			currentSection = SectionState.ArabicWords;
			continue;
		}

		if (trimmed === "### Approved By" && currentArabicWord) {
			currentSection = SectionState.ApprovedBy;
			continue;
		}

		if (trimmed.startsWith("- ")) {
			const item = trimmed.slice(2).trim();

			if (currentSection === SectionState.Tags) {
				result.tags.push(item);
			} else if (currentSection === SectionState.ApprovedBy && currentArabicWord) {
				currentArabicWord.approvedBy.push(item);
			}
			continue;
		}

		if (currentSection === SectionState.Description && trimmed.startsWith("## ")) {
			currentSection = SectionState.Unknown;
			continue;
		}

		if (currentSection === SectionState.Description) {
			if (trimmed) {
				result.description += trimmed + "\n";
			}
			continue;
		}
	}

	result.description = result.description.trim();

	if (!result.abbrev && result.title) {
		const words = result.title.trim().split(/\s+/);
		if (words.length > 1) {
			result.abbrev = generateAbbreviation(result.title);
		}
	}

	return result;
}

export function generateAbbreviation(title: string): string {
	if (typeof title !== "string" || !title.trim()) {
		return "";
	}

	const ignoreWords = new Set([
		"the",
		"a",
		"an",
		"in",
		"on",
		"at",
		"for",
		"with",
		"by",
		"and",
		"or",
		"as",
		"is",
		"are",
		"was",
		"were",
		"be",
		"been",
		"being",
	]);

	return title
		.split(/\s+/)
		.filter((word) => word.length > 0 && !ignoreWords.has(word.toLowerCase()))
		.map((word) => word[0].toUpperCase())
		.join("");
}

export function isValidTerm(term: unknown): term is ParsedTerm {
	if (!term) return false;
	const t = term as ParsedTerm;
	return (
		typeof t.title === "string" &&
		t.title.length > 0 &&
		Array.isArray(t.tags) &&
		Array.isArray(t.arabicWords)
	);
}

export function extractSlug(filename: string): string {
	if (typeof filename !== "string") {
		throw new Error("Filename must be a string");
	}
	return filename.replace(/\.md$/i, "");
}
