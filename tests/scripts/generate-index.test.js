/**
 * Tests for generate-index.ts script
 * Run with: deno test tests/scripts/generate-index.test.js
 */

import { assertEquals, assertExists } from "@std/assert";
import { 
  extractSlug, 
  generateIndex, 
  writeIndex,
  main,
  parseTermFile,
  aggregateApprovers,
  generateCategoriesIndex
} from "../../scripts/generate-index.ts";

// Test extractSlug
Deno.test("extractSlug - extracts slug from filename with .md extension", () => {
  assertEquals(extractSlug("api.md"), "api");
  assertEquals(extractSlug("rest-api.md"), "rest-api");
});

Deno.test("extractSlug - handles filename without extension", () => {
  assertEquals(extractSlug("api"), "api");
});

Deno.test("extractSlug - handles .MD uppercase extension", () => {
  assertEquals(extractSlug("API.MD"), "API");
});

// Test generateIndex
Deno.test("generateIndex - generates index from markdown files", async () => {
  // Create a temporary directory with test files
  const tempDir = await Deno.makeTempDir();
  
  try {
    // Create test markdown files
    await Deno.writeTextFile(
      `${tempDir}/test-term.md`,
      `# Test Term (TT)\n\n## Description\nThis is a test term.\n\n## Tags\n- test\n- example\n\n# Arabic Words\n\n## كلمة اختبار\n\n### Approved By\n- testuser\n`
    );
    
    await Deno.writeTextFile(
      `${tempDir}/another-term.md`,
      `# Another Term (AT)\n\n## Description\nAnother test term for sorting.\n\n## Tags\n- test\n\n# Arabic Words\n\n## مصطلح آخر\n\n### Approved By\n- user1\n- user2\n`
    );
    
    const index = await generateIndex(tempDir);
    
    assertExists(index.terms);
    assertEquals(index.terms.length, 2);
    assertExists(index.generatedAt);
    
    // Check structure of first term
    assertEquals(index.terms[0].slug, "another-term");
    assertEquals(index.terms[0].title, "Another Term");
    assertEquals(index.terms[0].abbrev, "AT");
    
    // Check structure of second term
    assertEquals(index.terms[1].slug, "test-term");
    assertEquals(index.terms[1].title, "Test Term");
    assertEquals(index.terms[1].abbrev, "TT");
    
    // Verify alphabetical sorting (Another comes before Test)
    assertEquals(index.terms[0].title, "Another Term");
    assertEquals(index.terms[1].title, "Test Term");
  } finally {
    // Cleanup
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("generateIndex - handles empty directory", async () => {
  const tempDir = await Deno.makeTempDir();
  
  try {
    const index = await generateIndex(tempDir);
    
    assertEquals(index.terms.length, 0);
    assertExists(index.generatedAt);
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("generateIndex - skips non-markdown files", async () => {
  const tempDir = await Deno.makeTempDir();
  
  try {
    await Deno.writeTextFile(
      `${tempDir}/test.md`,
      `# Test (T)\n\n## Description\nTest term.\n\n# Arabic Words\n\n## اختبار\n\n### Approved By\n- user\n`
    );
    await Deno.writeTextFile(`${tempDir}/readme.txt`, "This is not markdown");
    await Deno.writeTextFile(`${tempDir}/data.json`, '{"key": "value"}');
    
    const index = await generateIndex(tempDir);
    
    assertEquals(index.terms.length, 1);
    assertEquals(index.terms[0].slug, "test");
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("generateIndex - skips directories inside data dir", async () => {
  const tempDir = await Deno.makeTempDir();
  
  try {
    await Deno.writeTextFile(
      `${tempDir}/term.md`,
      `# Term (T)\n\n## Description\nA term.\n\n# Arabic Words\n\n## مصطلح\n\n### Approved By\n- user\n`
    );
    
    // Create subdirectory
    await Deno.mkdir(`${tempDir}/subdir`);
    await Deno.writeTextFile(
      `${tempDir}/subdir/nested.md`,
      `# Nested\n\n## Description\nNested term.\n`
    );
    
    const index = await generateIndex(tempDir);
    
    // Should only include top-level files
    assertEquals(index.terms.length, 1);
    assertEquals(index.terms[0].slug, "term");
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("generateIndex - continues on parse errors", async () => {
  const tempDir = await Deno.makeTempDir();
  
  try {
    // Valid file
    await Deno.writeTextFile(
      `${tempDir}/valid.md`,
      `# Valid Term (VT)\n\n## Description\nValid term.\n\n# Arabic Words\n\n## صحيح\n\n### Approved By\n- user\n`
    );
    
    // Invalid file (empty)
    await Deno.writeTextFile(`${tempDir}/invalid.md`, "");
    
    const index = await generateIndex(tempDir);
    
    // Should include valid file even if invalid one fails
    assertEquals(index.terms.length, 1);
    assertEquals(index.terms[0].slug, "valid");
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

// Test writeIndex
Deno.test("writeIndex - writes index to file", async () => {
  const tempDir = await Deno.makeTempDir();
  const outputFile = `${tempDir}/index.json`;
  
  try {
    const indexData = {
      terms: [
        { slug: "api", title: "API", abbrev: "Application Programming Interface" },
      ],
      generatedAt: "2026-02-15T12:00:00Z",
    };
    
    await writeIndex(indexData, outputFile);
    
    const content = await Deno.readTextFile(outputFile);
    const parsed = JSON.parse(content);
    
    assertEquals(parsed.terms.length, 1);
    assertEquals(parsed.terms[0].slug, "api");
    assertEquals(parsed.generatedAt, "2026-02-15T12:00:00Z");
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("writeIndex - creates JSON with 2-space indentation", async () => {
  const tempDir = await Deno.makeTempDir();
  const outputFile = `${tempDir}/index.json`;
  
  try {
    const indexData = {
      terms: [{ slug: "test", title: "Test", abbrev: "T" }],
      generatedAt: "2026-02-15T12:00:00Z",
    };
    
    await writeIndex(indexData, outputFile);
    
    const content = await Deno.readTextFile(outputFile);
    
    // Should be pretty-printed with 2-space indentation
    assertEquals(content.includes('\n  "terms"'), true);
    assertEquals(content.includes('\n  "generatedAt"'), true);
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

// Test main function
Deno.test("main - generates index with default paths", async () => {
  const tempDir = await Deno.makeTempDir();
  const outputFile = `${tempDir}/output.json`;
  
  try {
    await Deno.writeTextFile(
      `${tempDir}/term1.md`,
      `# Term One (TO)\n\n## Description\nFirst term.\n\n# Arabic Words\n\n## مصطلح أول\n\n### Approved By\n- user1\n`
    );
    
    await main([tempDir, outputFile]);
    
    const content = await Deno.readTextFile(outputFile);
    const parsed = JSON.parse(content);
    
    assertEquals(parsed.terms.length, 1);
    assertEquals(parsed.terms[0].title, "Term One");
    assertExists(parsed.generatedAt);
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

// Test parseTermFile
Deno.test("parseTermFile - parses valid markdown file", async () => {
  const tempDir = await Deno.makeTempDir();
  
  try {
    await Deno.writeTextFile(
      `${tempDir}/test.md`,
      `# Test Term (TT)\n\n## Description\nTest description.\n\n## Tags\n- tag1\n- tag2\n\n# Arabic Words\n\n## اختبار\n\n### Approved By\n- user1\n- user2\n`
    );
    
    const term = await parseTermFile(`${tempDir}/test.md`, "test.md");
    
    assertExists(term);
    assertEquals(term.title, "Test Term");
    assertEquals(term.abbrev, "TT");
    assertEquals(term.description, "Test description.");
    assertEquals(term.tags, ["tag1", "tag2"]);
    assertEquals(term.arabicWords.length, 1);
    assertEquals(term.arabicWords[0].word, "اختبار");
    assertEquals(term.arabicWords[0].approvedBy, ["user1", "user2"]);
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("parseTermFile - returns null for invalid file", async () => {
  const tempDir = await Deno.makeTempDir();
  
  try {
    await Deno.writeTextFile(`${tempDir}/empty.md`, "");
    
    const term = await parseTermFile(`${tempDir}/empty.md`, "empty.md");
    
    assertEquals(term, null);
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

// Test aggregateApprovers
Deno.test("aggregateApprovers - aggregates unique approvers with counts", () => {
  const terms = [
    {
      title: "Term 1",
      abbrev: "",
      description: "",
      tags: [],
      arabicWords: [
        { word: "مصطلح 1", approvedBy: ["user1", "user2"] },
        { word: "مصطلح ١", approvedBy: ["user1"] }
      ]
    },
    {
      title: "Term 2", 
      abbrev: "",
      description: "",
      tags: [],
      arabicWords: [
        { word: "مصطلح 2", approvedBy: ["user2", "user3"] }
      ]
    }
  ];
  
  const approvers = aggregateApprovers(terms);
  
  assertEquals(approvers.length, 3);
  
  // Should be sorted alphabetically
  assertEquals(approvers[0].username, "user1");
  assertEquals(approvers[0].approveCount, 2); // Approved 2 words
  
  assertEquals(approvers[1].username, "user2");
  assertEquals(approvers[1].approveCount, 2); // Approved 2 words
  
  assertEquals(approvers[2].username, "user3");
  assertEquals(approvers[2].approveCount, 1); // Approved 1 word
});

Deno.test("aggregateApprovers - handles empty terms array", () => {
  const approvers = aggregateApprovers([]);
  assertEquals(approvers.length, 0);
});

Deno.test("aggregateApprovers - handles terms without arabic words", () => {
  const terms = [
    { title: "Term 1", abbrev: "", description: "", tags: [], arabicWords: [] },
    { title: "Term 2", abbrev: "", description: "", tags: [], arabicWords: [{ word: "test", approvedBy: ["user1"] }] }
  ];
  
  const approvers = aggregateApprovers(terms);
  
  assertEquals(approvers.length, 1);
  assertEquals(approvers[0].username, "user1");
  assertEquals(approvers[0].approveCount, 1);
});

// Test generateCategoriesIndex
Deno.test("generateCategoriesIndex - generates categories from subdirectories", async () => {
  const tempDir = await Deno.makeTempDir();
  
  try {
    // Create category directories
    await Deno.mkdir(`${tempDir}/tech`);
    await Deno.mkdir(`${tempDir}/medical`);
    
    // Create term files in tech
    await Deno.writeTextFile(
      `${tempDir}/tech/api.md`,
      `# API\n\n## Description\nAPI description.\n\n## Tags\n- web\n\n# Arabic Words\n\n## واجهة\n\n### Approved By\n- user1\n- user2\n`
    );
    
    await Deno.writeTextFile(
      `${tempDir}/tech/rest.md`,
      `# REST\n\n## Description\nREST description.\n\n## Tags\n- web\n\n# Arabic Words\n\n## ريست\n\n### Approved By\n- user2\n- user3\n`
    );
    
    // Create term files in medical
    await Deno.writeTextFile(
      `${tempDir}/medical/mri.md`,
      `# MRI\n\n## Description\nMRI description.\n\n## Tags\n- imaging\n\n# Arabic Words\n\n## رنين\n\n### Approved By\n- user1\n`
    );
    
    const categoriesIndex = await generateCategoriesIndex(tempDir);
    
    assertExists(categoriesIndex.categories);
    assertEquals(categoriesIndex.categories.length, 2);
    assertExists(categoriesIndex.generatedAt);
    
    // Should be sorted alphabetically: medical, tech
    assertEquals(categoriesIndex.categories[0].name, "medical");
    assertEquals(categoriesIndex.categories[0].termsCount, 1);
    assertEquals(categoriesIndex.categories[0].approvers.length, 1);
    assertEquals(categoriesIndex.categories[0].approvers[0].username, "user1");
    assertEquals(categoriesIndex.categories[0].approvers[0].approveCount, 1);
    
    assertEquals(categoriesIndex.categories[1].name, "tech");
    assertEquals(categoriesIndex.categories[1].termsCount, 2);
    assertEquals(categoriesIndex.categories[1].approvers.length, 3);
    
    // Approvers should be sorted alphabetically
    assertEquals(categoriesIndex.categories[1].approvers[0].username, "user1");
    assertEquals(categoriesIndex.categories[1].approvers[0].approveCount, 1);
    assertEquals(categoriesIndex.categories[1].approvers[1].username, "user2");
    assertEquals(categoriesIndex.categories[1].approvers[1].approveCount, 2);
    assertEquals(categoriesIndex.categories[1].approvers[2].username, "user3");
    assertEquals(categoriesIndex.categories[1].approvers[2].approveCount, 1);
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("generateCategoriesIndex - skips empty directories", async () => {
  const tempDir = await Deno.makeTempDir();
  
  try {
    await Deno.mkdir(`${tempDir}/empty-category`);
    await Deno.mkdir(`${tempDir}/with-terms`);
    
    await Deno.writeTextFile(
      `${tempDir}/with-terms/term.md`,
      `# Term\n\n## Description\nDesc.\n\n# Arabic Words\n\n## مصطلح\n\n### Approved By\n- user1\n`
    );
    
    const categoriesIndex = await generateCategoriesIndex(tempDir);
    
    assertEquals(categoriesIndex.categories.length, 1);
    assertEquals(categoriesIndex.categories[0].name, "with-terms");
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("generateCategoriesIndex - handles empty root directory", async () => {
  const tempDir = await Deno.makeTempDir();
  
  try {
    const categoriesIndex = await generateCategoriesIndex(tempDir);
    
    assertEquals(categoriesIndex.categories.length, 0);
    assertExists(categoriesIndex.generatedAt);
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("generateCategoriesIndex - aggregates approvers across all terms in category", async () => {
  const tempDir = await Deno.makeTempDir();
  
  try {
    await Deno.mkdir(`${tempDir}/category`);
    
    // Term with multiple arabic words
    await Deno.writeTextFile(
      `${tempDir}/category/term1.md`,
      `# Term 1\n\n## Description\nDesc.\n\n# Arabic Words\n\n## كلمة 1\n\n### Approved By\n- alice\n- bob\n\n## كلمة ٢\n\n### Approved By\n- alice\n- charlie\n`
    );
    
    // Another term
    await Deno.writeTextFile(
      `${tempDir}/category/term2.md`,
      `# Term 2\n\n## Description\nDesc.\n\n# Arabic Words\n\n## كلمة 2\n\n### Approved By\n- bob\n- charlie\n- dave\n`
    );
    
    const categoriesIndex = await generateCategoriesIndex(tempDir);
    
    assertEquals(categoriesIndex.categories.length, 1);
    
    const category = categoriesIndex.categories[0];
    assertEquals(category.termsCount, 2);
    assertEquals(category.approvers.length, 4);
    
    // Check aggregated counts
    const alice = category.approvers.find(a => a.username === "alice");
    const bob = category.approvers.find(a => a.username === "bob");
    const charlie = category.approvers.find(a => a.username === "charlie");
    const dave = category.approvers.find(a => a.username === "dave");
    
    assertExists(alice);
    assertEquals(alice.approveCount, 2); // alice approved 2 words in term1
    
    assertExists(bob);
    assertEquals(bob.approveCount, 2); // bob approved 1 word in term1 + 1 in term2
    
    assertExists(charlie);
    assertEquals(charlie.approveCount, 2); // charlie approved 1 word in term1 + 1 in term2
    
    assertExists(dave);
    assertEquals(dave.approveCount, 1); // dave approved 1 word in term2
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

// Test main with --categories flag
Deno.test("main - generates categories index with --categories flag", async () => {
  const tempDir = await Deno.makeTempDir();
  const outputFile = `${tempDir}/categories.json`;
  
  try {
    // Create category directories with terms
    await Deno.mkdir(`${tempDir}/tech`);
    await Deno.writeTextFile(
      `${tempDir}/tech/api.md`,
      `# API\n\n## Description\nAPI desc.\n\n# Arabic Words\n\n## واجهة\n\n### Approved By\n- user1\n`
    );
    
    await main(["--categories", tempDir, outputFile]);
    
    const content = await Deno.readTextFile(outputFile);
    const parsed = JSON.parse(content);
    
    assertExists(parsed.categories);
    assertEquals(parsed.categories.length, 1);
    assertEquals(parsed.categories[0].name, "tech");
    assertEquals(parsed.categories[0].termsCount, 1);
    assertExists(parsed.generatedAt);
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("main - generates categories index with default output path", async () => {
  const tempDir = await Deno.makeTempDir();
  const defaultOutput = `${tempDir}/categories.json`;
  
  try {
    await Deno.mkdir(`${tempDir}/category`);
    await Deno.writeTextFile(
      `${tempDir}/category/term.md`,
      `# Term\n\n## Description\nDesc.\n\n# Arabic Words\n\n## مصطلح\n\n### Approved By\n- user1\n`
    );
    
    // Call main with --categories and only dataDir
    await main(["--categories", tempDir]);
    
    // Should create categories.json in the dataDir
    const content = await Deno.readTextFile(defaultOutput);
    const parsed = JSON.parse(content);
    
    assertEquals(parsed.categories.length, 1);
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});
