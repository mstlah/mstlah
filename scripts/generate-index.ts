#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * Index Generator Script
 * Generates index.json from markdown term files
 * 
 * Usage:
 *   deno run --allow-read --allow-write scripts/generate-index.ts [dataDir] [outputFile]
 *   deno run --allow-read --allow-write scripts/generate-index.ts --categories [dataDir] [outputFile]
 *   deno run --allow-read --allow-write scripts/generate-index.ts --full [dataDir]
 * 
 * Arguments:
 *   --categories - Generate top-level categories index instead of terms index
 *   --full       - Generate index.json in each category dir, then generate categories.json
 *   dataDir      - Directory containing .md term files or subdirectories (default: "./data")
 *   outputFile   - Output JSON file path (default: "./data/index.json" or "./data/categories.json")
 */

import type { Term, TermIndex, CategoryIndex, RootIndex } from "../src/lib/types.ts";
import { parseMarkdown, isValidTerm } from "../src/lib/md-parser.ts";

interface ApproverInfo {
	username: string;
	approveCount: number;
}

interface CategoryMeta {
	name: string;
	description?: string;
}

/**
 * Extract slug from filename
 */
export function extractSlug(filename: string): string {
  if (typeof filename !== "string") {
    throw new TypeError("Filename must be a string");
  }
  return filename.replace(/\.md$/i, "");
}

/**
 * Parse a single markdown file and return the term data
 */
export async function parseTermFile(filePath: string, filename: string): Promise<Term | null> {
  try {
    const content = await Deno.readTextFile(filePath);
    const term = parseMarkdown(content);
    
    if (!isValidTerm(term)) {
      console.error(`Skipping invalid file ${filename}: missing required fields`);
      return null;
    }
    
    return term;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`Error parsing ${filename}: ${errorMessage}`);
    return null;
  }
}

/**
 * Generate index data from markdown files in a directory
 */
export async function generateIndex(dataDir: string): Promise<CategoryIndex> {
  const terms = [];
  
  // Read directory
  for await (const entry of Deno.readDir(dataDir)) {
    if (!entry.isFile || !entry.name.endsWith(".md")) {
      continue;
    }
    
    const slug = extractSlug(entry.name);
    const filePath = `${dataDir}/${entry.name}`;
    
    const term = await parseTermFile(filePath, entry.name);
    if (!term) {
      continue;
    }
    
    const termIndex: TermIndex = {
      slug,
      title: term.title,
      ...(term.abbrev && { abbrev: term.abbrev }),
    };

    terms.push(termIndex);
  }
  
  // Sort terms alphabetically by title
  terms.sort((a, b) => a.title.localeCompare(b.title));
  
  return {
    terms,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Read meta.json from a category directory
 */
export async function readCategoryMeta(categoryPath: string): Promise<CategoryMeta | null> {
  try {
    const metaPath = `${categoryPath}/meta.json`;
    const content = await Deno.readTextFile(metaPath);
    const meta = JSON.parse(content);
    
    if (!meta.name) {
      console.warn(`Warning: meta.json in ${categoryPath} is missing "name" field`);
      return null;
    }
    
    return {
      name: meta.name,
      description: meta.description || undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Aggregate approvers from terms, counting unique approvals per user
 */
export function aggregateApprovers(terms: Term[]): ApproverInfo[] {
  const approverCounts = new Map<string, number>();
  
  for (const term of terms) {
    if (!term.arabicWords) continue;
    
    for (const arabicWord of term.arabicWords) {
      if (!arabicWord.approvedBy) continue;
      
      for (const username of arabicWord.approvedBy) {
        approverCounts.set(username, (approverCounts.get(username) || 0) + 1);
      }
    }
  }
  
  // Convert to array and sort alphabetically by username
  const approvers = Array.from(approverCounts.entries())
    .map(([username, approveCount]) => ({ username, approveCount }))
    .sort((a, b) => a.username.localeCompare(b.username));
  
  return approvers;
}

/**
 * Generate categories index from subdirectories
 */
export async function generateCategoriesIndex(dataDir: string): Promise<RootIndex> {
  const categories = [];
  
  // Read subdirectories
  for await (const entry of Deno.readDir(dataDir)) {
    if (!entry.isDirectory) {
      continue;
    }
    
    const categoryPath = entry.name;
    const categoryFullPath = `${dataDir}/${categoryPath}`;
    
    // Read meta.json if exists
    const meta = await readCategoryMeta(categoryFullPath);
    
    // Collect all terms in this category
    const terms: Term[] = [];
    const termIndex: TermIndex[] = [];
    
    for await (const fileEntry of Deno.readDir(categoryFullPath)) {
      if (!fileEntry.isFile || !fileEntry.name.endsWith(".md")) {
        continue;
      }
      
      const filePath = `${categoryFullPath}/${fileEntry.name}`;
      const term = await parseTermFile(filePath, fileEntry.name);
      
      if (term) {
        terms.push(term);
        
        const idx: TermIndex = {
          slug: extractSlug(fileEntry.name),
          title: term.title,
          ...(term.abbrev && { abbrev: term.abbrev }),
        };
        termIndex.push(idx);
      }
    }
    
    // Only add category if it has terms
    if (terms.length > 0) {
      const approvers = aggregateApprovers(terms);
      
      // Sort term index alphabetically by title
      termIndex.sort((a, b) => a.title.localeCompare(b.title));
      
      categories.push({
        path: categoryPath,
        name: meta?.name || categoryPath,
        description: meta?.description,
        termsCount: terms.length,
        approvers,
        terms: termIndex,
      });
    }
  }
  
  // Sort categories alphabetically by Arabic name
  categories.sort((a, b) => a.name.localeCompare(b.name, "ar"));
  
  return {
    categories,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Write index to file
 * @param {object} indexData - The index data to write
 * @param {string} outputPath - Output file path
 * @returns {Promise<void>}
 */
export async function writeIndex(
  indexData: object,
  outputPath: string
): Promise<void> {
  const json = JSON.stringify(indexData, null, 2);
  await Deno.writeTextFile(outputPath, json + "\n");
}

/**
 * Main function
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
export async function main(args: string[]): Promise<void> {
  // Check for flags
  const isCategoriesMode = args.includes("--categories");
  const isFullMode = args.includes("--full");
  const filteredArgs = args.filter(arg => arg !== "--categories" && arg !== "--full");
  
  const dataDir = filteredArgs[0] || "./data";
  const outputFile = filteredArgs[1] || (isCategoriesMode ? `${dataDir}/categories.json` : `${dataDir}/index.json`);
  
  if (isFullMode) {
    console.log(`Running full generation for ${dataDir}...`);
    
    // First, generate index.json for each category directory
    const categoryDirs: string[] = [];
    
    for await (const entry of Deno.readDir(dataDir)) {
      if (!entry.isDirectory) {
        continue;
      }
      
      const categoryPath = entry.name;
      const categoryFullPath = `${dataDir}/${categoryPath}`;
      const indexOutputPath = `${categoryFullPath}/index.json`;
      
      // Generate index for this category
      const indexData = await generateIndex(categoryFullPath);
      
      if (indexData.terms.length > 0) {
        await writeIndex(indexData, indexOutputPath);
        console.log(`Generated ${indexOutputPath} with ${indexData.terms.length} terms`);
        categoryDirs.push(categoryPath);
      }
    }
    
    // Then generate categories.json
    console.log(`\nGenerating categories index...`);
    const categoriesData = await generateCategoriesIndex(dataDir);
    
    await writeIndex(categoriesData, `${dataDir}/categories.json`);
    
    console.log(`\nCategories index written to ${dataDir}/categories.json`);
    console.log(`Generated at: ${categoriesData.generatedAt}`);
    console.log(`Total categories: ${categoriesData.categories.length}`);
    
  } else if (isCategoriesMode) {
    console.log(`Generating categories index from ${dataDir}...`);
    
    const categoriesData = await generateCategoriesIndex(dataDir);
    
    console.log(`Found ${categoriesData.categories.length} categories`);
    
    await writeIndex(categoriesData, outputFile);
    
    console.log(`Categories index written to ${outputFile}`);
    console.log(`Generated at: ${categoriesData.generatedAt}`);
  } else {
    console.log(`Generating index from ${dataDir}...`);
    
    const indexData = await generateIndex(dataDir);
    
    console.log(`Found ${indexData.terms.length} terms`);
    
    await writeIndex(indexData, outputFile);
    
    console.log(`Index written to ${outputFile}`);
    console.log(`Generated at: ${indexData.generatedAt}`);
  }
}

// Run if this is the main module
if (import.meta.main) {
  await main(Deno.args);
}
