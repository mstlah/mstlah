/**
 * @fileoverview Tests for the markdown parser.
 * Run with: deno test tests/md-parser.test.js
 */

import { 
  parseMarkdown, 
  isValidTerm, 
  extractSlug,
  generateAbbreviation
} from '../src/lib/md-parser';
import { assertEquals, assertThrows } from "jsr:@std/assert";

Deno.test("parseMarkdown - parses complete term correctly", () => {
  const content = `# Application Programming Interface (API)

## Description
A software interface that allows two applications to communicate with each other.
It defines the methods and data formats that programs can use.

## Tags
- programming
- web
- interface

# Arabic Words

## واجهة برمجة التطبيقات
### Approved By
- user1
- user2

## الواجهة البرمجية
### Approved By
- user3
`;

  const result = parseMarkdown(content);

  assertEquals(result.title, "Application Programming Interface");
  assertEquals(result.abbrev, "API");
  assertEquals(result.description, "A software interface that allows two applications to communicate with each other.\nIt defines the methods and data formats that programs can use.");
  assertEquals(result.tags, ["programming", "web", "interface"]);
  assertEquals(result.arabicWords.length, 2);
  assertEquals(result.arabicWords[0].word, "واجهة برمجة التطبيقات");
  assertEquals(result.arabicWords[0].approvedBy, ["user1", "user2"]);
  assertEquals(result.arabicWords[1].word, "الواجهة البرمجية");
  assertEquals(result.arabicWords[1].approvedBy, ["user3"]);
});

Deno.test("parseMarkdown - generates abbreviation from title when not provided", () => {
  const content = `# Object Oriented Programming

## Description
A programming paradigm.

## Tags
- programming

# Arabic Words

## البرمجة كائنية التوجه
### Approved By
- user1
`;

  const result = parseMarkdown(content);

  assertEquals(result.title, "Object Oriented Programming");
  assertEquals(result.abbrev, "OOP");  // Auto-generated from first letters
  assertEquals(result.description, "A programming paradigm.");
});

Deno.test("parseMarkdown - handles term without Arabic words", () => {
  const content = `# API (Application Programming Interface)

## Description
Description here.

## Tags
- web

# Arabic Words
`;

  const result = parseMarkdown(content);

  assertEquals(result.arabicWords, []);
});

Deno.test("parseMarkdown - handles term without tags", () => {
  const content = `# API

## Description
Description.

## Tags

# Arabic Words
## واجهة
### Approved By
- user1
`;

  const result = parseMarkdown(content);

  assertEquals(result.tags, []);
});

Deno.test("parseMarkdown - handles multi-line description", () => {
  const content = `# API

## Description
Line 1
Line 2

Line 3

## Tags
- tag1
`;

  const result = parseMarkdown(content);

  assertEquals(result.description, "Line 1\nLine 2\nLine 3");
});

Deno.test("parseMarkdown - skips unknown sections", () => {
  const content = `# API

## Description
Description.

## Unknown Section
- item1
- item2

## Tags
- web

# Arabic Words
`;

  const result = parseMarkdown(content);

  assertEquals(result.title, "API");
  assertEquals(result.description, "Description.");
  assertEquals(result.tags, ["web"]);
});

Deno.test("parseMarkdown - handles empty content", () => {
  const result = parseMarkdown("");

  assertEquals(result.title, "");
  assertEquals(result.abbrev, "");
  assertEquals(result.description, "");
  assertEquals(result.tags, []);
  assertEquals(result.arabicWords, []);
});

Deno.test("parseMarkdown - handles Arabic words without approved by", () => {
  const content = `# API

## Description
Description.

## Tags
- web

# Arabic Words
## واجهة
`;

  const result = parseMarkdown(content);

  assertEquals(result.arabicWords.length, 1);
  assertEquals(result.arabicWords[0].word, "واجهة");
  assertEquals(result.arabicWords[0].approvedBy, []);
});

Deno.test("parseMarkdown - handles approved by outside Arabic words section", () => {
  const content = `# API

## Description
Description.

### Approved By
- user1

## Tags
- web
`;

  const result = parseMarkdown(content);

  // Approved by outside Arabic Words section should be ignored
  assertEquals(result.arabicWords, []);
});

Deno.test("isValidTerm - returns true for valid term", () => {
  const term = {
    title: "API",
    abbrev: "",
    description: "Description",
    tags: ["web"],
    arabicWords: [{ word: "واجهة", approvedBy: [] }]
  };

  assertEquals(isValidTerm(term), true);
});

Deno.test("isValidTerm - returns false for term without title", () => {
  const term = {
    title: "",
    abbrev: "",
    description: "Description",
    tags: [],
    arabicWords: []
  };

  assertEquals(isValidTerm(term), false);
});

Deno.test("isValidTerm - returns false for null/undefined", () => {
  assertEquals(isValidTerm(null), false);
  assertEquals(isValidTerm(undefined), false);
});

Deno.test("isValidTerm - returns false for invalid arrays", () => {
  const term = {
    title: "API",
    tags: null,
    arabicWords: null
  };

  assertEquals(isValidTerm(term), false);
});

Deno.test("extractSlug - extracts slug from filename", () => {
  assertEquals(extractSlug("api.md"), "api");
  assertEquals(extractSlug("object-oriented-programming.md"), "object-oriented-programming");
  assertEquals(extractSlug("API.MD"), "API");
});

Deno.test("extractSlug - handles filename without extension", () => {
  assertEquals(extractSlug("api"), "api");
});

Deno.test("parseMarkdown - handles special characters in title", () => {
  const content = `# C++ (C Plus Plus)

## Description
A programming language.

## Tags
- programming
`;

  const result = parseMarkdown(content);

  assertEquals(result.title, "C++");
  assertEquals(result.abbrev, "C Plus Plus");
});

Deno.test("parseMarkdown - handles markdown in description", () => {
  const content = `# API

## Description
This is **bold** and _italic_ text.
It supports [links](http://example.com).

## Tags
- web
`;

  const result = parseMarkdown(content);

  // Parser should preserve markdown in description
  assertEquals(result.description.includes("**bold**"), true);
  assertEquals(result.description.includes("[links]"), true);
});

// Tests for generateAbbreviation function
Deno.test("generateAbbreviation - generates abbreviation from multi-word title", () => {
  assertEquals(generateAbbreviation("Separation of Concerns"), "SOC");  // includes 'of'
  assertEquals(generateAbbreviation("Continuous Integration"), "CI");
  assertEquals(generateAbbreviation("Object Oriented Programming"), "OOP");
});

Deno.test("generateAbbreviation - ignores common small words", () => {
  assertEquals(generateAbbreviation("Theory of Computation"), "TOC");  // includes 'of'
  assertEquals(generateAbbreviation("Design Patterns for Dummies"), "DPD");  // 'for' is filtered out
  assertEquals(generateAbbreviation("Introduction to Algorithms"), "ITA");  // includes 'to'
});

Deno.test("generateAbbreviation - handles single word title", () => {
  assertEquals(generateAbbreviation("Microservices"), "M");
  assertEquals(generateAbbreviation("Database"), "D");
});

Deno.test("generateAbbreviation - preserves existing abbreviation", () => {
  // When abbreviation is provided in parentheses, it should be used
  const content = `# API (Application Programming Interface)

## Description
Description here.

## Tags
- web
`;
  const result = parseMarkdown(content);
  assertEquals(result.abbrev, "Application Programming Interface");
});

Deno.test("generateAbbreviation - handles empty and invalid inputs", () => {
  assertEquals(generateAbbreviation(""), "");
  assertEquals(generateAbbreviation("   "), "");
});

Deno.test("generateAbbreviation - handles mixed case", () => {
  assertEquals(generateAbbreviation("Java Virtual Machine"), "JVM");
  assertEquals(generateAbbreviation(" artificial intelligence "), "AI");
});
