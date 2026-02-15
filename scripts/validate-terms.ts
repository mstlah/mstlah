#!/usr/bin/env -S deno run --allow-read

/**
 * @fileoverview Validation script for Arabic tech terms markdown files.
 * Checks files against the expected format and reports any issues.
 */

import { parseMarkdown, isValidTerm, type ParsedTerm } from '../src/lib/md-parser.ts';

interface ValidationError {
  file: string;
  type: 'required' | 'format' | 'content';
  message: string;
  line?: number;
}

interface ValidationResultData {
  title: string;
  abbrev: string;
  tagsCount: number;
  arabicWordsCount: number;
}

interface ValidationResult {
  valid: boolean;
  file: string;
  errors: ValidationError[];
  data?: ValidationResultData;
}

interface FileInfo {
  path: string;
  name: string;
}

function containsArabic(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);
}

function validateTermStructure(term: ParsedTerm, content: string, filename: string): ValidationError[] {
  const errors: ValidationError[] = [];
  const lines = content.split('\n');

  const termAny = term as unknown;
  const valid = isValidTerm(termAny);

  if (!valid) {
    if (!term.title || term.title.length === 0) {
      errors.push({
        file: filename,
        type: 'required',
        message: 'Missing or empty title (expected: # Title)',
        line: findLineNumber(lines, /^# /)
      });
    }
    if (!Array.isArray(term.tags)) {
      errors.push({
        file: filename,
        type: 'required',
        message: 'Tags section missing or invalid (expected: ## Tags with list items)',
        line: findLineNumber(lines, /^## Tags$/)
      });
    }
    if (!Array.isArray(term.arabicWords)) {
      errors.push({
        file: filename,
        type: 'required',
        message: 'Arabic Words section missing or invalid (expected: # Arabic Words with ## Arabic Word subsections)',
        line: findLineNumber(lines, /^# Arabic Words$/)
      });
    }
    return errors;
  }

  if (!term.description || term.description.trim().length === 0) {
    errors.push({
      file: filename,
      type: 'required',
      message: 'Missing or empty description (expected: ## Description with Arabic content)',
      line: findLineNumber(lines, /^## Description$/)
    });
  } else if (!containsArabic(term.description)) {
    errors.push({
      file: filename,
      type: 'content',
      message: 'Description must be in Arabic',
      line: findLineNumber(lines, /^## Description$/)
    });
  }

  if (term.tags.length === 0) {
    errors.push({
      file: filename,
      type: 'required',
      message: 'At least one tag is required (expected: - tagname in ## Tags section)',
      line: findLineNumber(lines, /^## Tags$/)
    });
  } else {
    const nonArabicTags = term.tags.filter((tag: string) => !containsArabic(tag));
    if (nonArabicTags.length > 0) {
      errors.push({
        file: filename,
        type: 'content',
        message: `All tags must be in Arabic. Non-Arabic tags: ${nonArabicTags.join(', ')}`,
        line: findLineNumber(lines, /^## Tags$/)
      });
    }
  }

  if (term.arabicWords.length === 0) {
    errors.push({
      file: filename,
      type: 'required',
      message: 'At least one Arabic word is required (expected: ## Arabic Word in # Arabic Words section)',
      line: findLineNumber(lines, /^# Arabic Words$/)
    });
  } else {
    term.arabicWords.forEach((aw, index) => {
      if (!aw.word || aw.word.trim().length === 0) {
        errors.push({
          file: filename,
          type: 'required',
          message: `Arabic word #${index + 1} is empty`,
          line: findLineNumber(lines, /^## .+$/, index + 1)
        });
      } else if (!containsArabic(aw.word)) {
        errors.push({
          file: filename,
          type: 'content',
          message: `Arabic word #${index + 1} must be in Arabic: "${aw.word}"`,
          line: findLineNumber(lines, new RegExp(`^## ${escapeRegex(aw.word)}$`))
        });
      }

      if (!aw.approvedBy || aw.approvedBy.length === 0) {
        errors.push({
          file: filename,
          type: 'required',
          message: `Arabic word "${aw.word}" must have at least one approver (expected: ### Approved By with - username)`,
          line: findLineNumber(lines, /^### Approved By$/)
        });
      }
    });
  }

  return errors;
}

function findLineNumber(lines: string[], pattern: RegExp, occurrence: number = 1): number | undefined {
  let count = 0;
  for (let i = 0; i < lines.length; i++) {
    if (pattern.test(lines[i].trim())) {
      count++;
      if (count === occurrence) {
        return i + 1;
      }
    }
  }
  return undefined;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function validateFile(filePath: string, filename: string): Promise<ValidationResult> {
  try {
    const content = await Deno.readTextFile(filePath);
    
    let term: ReturnType<typeof parseMarkdown>;
    try {
      term = parseMarkdown(content);
    } catch (parseError) {
      return {
        valid: false,
        file: filename,
        errors: [{
          file: filename,
          type: 'format',
          message: `Parse error: ${parseError instanceof Error ? parseError.message : String(parseError)}`
        }]
      };
    }

    const errors = validateTermStructure(term as ParsedTerm, content, filename);

    if (errors.length === 0) {
      return {
        valid: true,
        file: filename,
        errors: [],
        data: {
          title: term.title,
          abbrev: term.abbrev,
          tagsCount: term.tags.length,
          arabicWordsCount: term.arabicWords.length
        }
      };
    }

    return {
      valid: false,
      file: filename,
      errors
    };
  } catch (error) {
    return {
      valid: false,
      file: filename,
      errors: [{
        file: filename,
        type: 'format',
        message: `File read error: ${error instanceof Error ? error.message : String(error)}`
      }]
    };
  }
}

async function findMarkdownFiles(dirPath: string): Promise<FileInfo[]> {
  const files: FileInfo[] = [];
  
  try {
    for await (const entry of Deno.readDir(dirPath)) {
      const fullPath = `${dirPath}/${entry.name}`;
      
      if (entry.isDirectory && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        const subFiles = await findMarkdownFiles(fullPath);
        files.push(...subFiles);
      } else if (entry.isFile && entry.name.endsWith('.md')) {
        files.push({ path: fullPath, name: entry.name });
      }
    }
  } catch (error) {
    throw new Error(`Cannot read directory ${dirPath}: ${error instanceof Error ? error.message : String(error)}`);
  }
  
  return files;
}

function formatResults(results: ValidationResult[]): string {
  const lines: string[] = [];
  let validCount = 0;
  let invalidCount = 0;

  results.forEach((result: ValidationResult) => {
    if (result.valid) {
      validCount++;
      lines.push(`✓ ${result.file}`);
      if (result.data) {
        lines.push(`  Title: ${result.data.title}`);
        if (result.data.abbrev) {
          lines.push(`  Abbrev: ${result.data.abbrev}`);
        }
        lines.push(`  Tags: ${result.data.tagsCount}, Arabic Words: ${result.data.arabicWordsCount}`);
      }
    } else {
      invalidCount++;
      lines.push(`✗ ${result.file}`);
      result.errors.forEach((error: ValidationError) => {
        const lineInfo = error.line ? ` (line ${error.line})` : '';
        lines.push(`  [${error.type.toUpperCase()}] ${error.message}${lineInfo}`);
      });
    }
    lines.push('');
  });

  lines.push('─'.repeat(50));
  lines.push(`Summary: ${validCount} valid, ${invalidCount} invalid, ${results.length} total`);
  
  return lines.join('\n');
}

async function main(args: string[]): Promise<number> {
  let paths: string[] = [];
  let verbose = false;
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--verbose' || args[i] === '-v') {
      verbose = true;
    } else if (args[i] === '--help' || args[i] === '-h') {
      console.log(`
Usage: deno run --allow-read scripts/validate-terms.ts [options] [paths...]

Validates markdown term files against the expected format.

Options:
  --verbose, -v    Show detailed output for valid files
  --help, -h       Show this help message

Arguments:
  paths            Files or directories to validate (default: ./data)

Examples:
  deno run --allow-read scripts/validate-terms.ts
  deno run --allow-read scripts/validate-terms.ts ./data/tech
  deno run --allow-read scripts/validate-terms.ts ./data/tech/api.md
  deno run --allow-read --allow-write scripts/validate-terms.ts --verbose ./data
`);
      return 0;
    } else if (!args[i].startsWith('-')) {
      paths.push(args[i]);
    }
  }

  if (paths.length === 0) {
    paths = ['./data'];
  }

  const allResults: ValidationResult[] = [];

  for (const path of paths) {
    try {
      const stat = await Deno.stat(path);
      
      if (stat.isFile) {
        if (path.endsWith('.md')) {
          const result = await validateFile(path, path.split('/').pop() || path);
          allResults.push(result);
        } else {
          console.error(`Error: ${path} is not a markdown file`);
        }
      } else if (stat.isDirectory) {
        const files = await findMarkdownFiles(path);
        
        if (files.length === 0) {
          console.warn(`Warning: No markdown files found in ${path}`);
          continue;
        }

        console.log(`Found ${files.length} markdown file(s) in ${path}\n`);

        for (const file of files) {
          const result = await validateFile(file.path, file.name);
          allResults.push(result);
        }
      }
    } catch (error) {
      console.error(`Error accessing ${path}: ${error instanceof Error ? error.message : String(error)}`);
      return 1;
    }
  }

  if (allResults.length === 0) {
    console.log('No files to validate.');
    return 0;
  }

  console.log(formatResults(allResults));

  const hasErrors = allResults.some(r => !r.valid);
  return hasErrors ? 1 : 0;
}

if (import.meta.main) {
  const exitCode = await main(Deno.args);
  Deno.exit(exitCode);
}

export { validateFile, findMarkdownFiles, validateTermStructure, containsArabic };
