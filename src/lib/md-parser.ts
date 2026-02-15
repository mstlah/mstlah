/**
 * @fileoverview Markdown parser for Arabic tech terms.
 * Parses markdown files into structured term objects.
 */

import type { Term } from "./types";

type ParsedTerm = Term;
type ArabicWord = ParsedTerm["arabicWords"][number];

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

	let currentSection: string | null = null;
	let currentArabicWord: ArabicWord | null = null;
	let titleFound = false;

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const trimmed = line.trim();

		if (!trimmed && currentSection !== "description") {
			continue;
		}

		if (!titleFound && trimmed.startsWith("# ") && !trimmed.startsWith("## ")) {
			const match = trimmed.match(/^# (.+?)(?:\s*\(([^)]+)\))?$/);
			if (match) {
				result.title = match[1].trim();
				result.abbrev = match[2] || "";
				titleFound = true;
			}
			currentSection = null;
			continue;
		}

		if (trimmed === "## Description") {
			currentSection = "description";
			result.description = "";
			continue;
		}

		if (trimmed === "## Tags") {
			currentSection = "tags";
			continue;
		}

		if (trimmed === "# Arabic Words") {
			currentSection = "arabic-words";
			continue;
		}

		if (
			trimmed.startsWith("## ") &&
			(currentSection === "arabic-words" || currentSection === "approved-by")
		) {
			currentArabicWord = {
				word: trimmed.replace("## ", "").trim(),
				approvedBy: [],
			} as ArabicWord;
			result.arabicWords.push(currentArabicWord);
			currentSection = "arabic-words";
			continue;
		}

		if (trimmed === "### Approved By" && currentArabicWord) {
			currentSection = "approved-by";
			continue;
		}

		if (trimmed.startsWith("- ")) {
			const item = trimmed.slice(2).trim();

			if (currentSection === "tags") {
				result.tags.push(item);
			} else if (currentSection === "approved-by" && currentArabicWord) {
				currentArabicWord.approvedBy.push(item);
			}
			continue;
		}

		if (currentSection === "description" && trimmed.startsWith("## ")) {
			currentSection = "unknown";
			continue;
		}

		if (currentSection === "description") {
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
