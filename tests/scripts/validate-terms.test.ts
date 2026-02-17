/**
 * @fileoverview Tests for the validate-terms script.
 */

import { 
  validateFile, 
  findMarkdownFiles, 
  validateTermStructure, 
  containsArabic 
} from '../../scripts/validate-terms.ts';
import { assertEquals, assertExists } from "@std/assert";

interface ArabicWord {
  word: string;
  approvedBy: string[];
}

interface ParsedTerm {
  title: string;
  abbrev: string;
  description: string;
  tags: string[];
  arabicWords: ArabicWord[];
}

interface FileInfo {
  path: string;
  name: string;
}

Deno.test("containsArabic - detects Arabic text", () => {
  assertEquals(containsArabic("واجهة برمجة التطبيقات"), true);
  assertEquals(containsArabic("API واجهة"), true);
  assertEquals(containsArabic("Hello World"), false);
  assertEquals(containsArabic("API"), false);
  assertEquals(containsArabic(""), false);
  assertEquals(containsArabic(null as unknown as string), false);
  assertEquals(containsArabic(undefined as unknown as string), false);
});

Deno.test("validateTermStructure - validates complete term", () => {
  const content = `# Application Programming Interface

## Description
واجهة برمجة التطبيقات...

## Tags
- معمارية
- ويب

# Arabic Words

## واجهة برمجة التطبيقات
### Approved By
- user1
`;
  
  const term: ParsedTerm = {
    title: 'Application Programming Interface',
    abbrev: 'API',
    description: 'واجهة برمجة التطبيقات...',
    tags: ['معمارية', 'ويب'],
    arabicWords: [
      { word: 'واجهة برمجة التطبيقات', approvedBy: ['user1'] }
    ]
  };
  
  const errors = validateTermStructure(term, content, 'api.md');
  assertEquals(errors.length, 0);
});

Deno.test("validateTermStructure - detects missing description", () => {
  const content = `# API

## Description

## Tags
- ويب

# Arabic Words

## واجهة
### Approved By
- user1
`;
  
  const term: ParsedTerm = {
    title: 'API',
    abbrev: '',
    description: '',
    tags: ['ويب'],
    arabicWords: [
      { word: 'واجهة', approvedBy: ['user1'] }
    ]
  };
  
  const errors = validateTermStructure(term, content, 'api.md');
  assertEquals(errors.length, 1);
  assertEquals(errors[0].type, 'required');
  assertEquals(errors[0].message.includes('description'), true);
});

Deno.test("validateTermStructure - detects non-Arabic description", () => {
  const content = `# API

## Description
This is an API description in English

## Tags
- ويب

# Arabic Words

## واجهة
### Approved By
- user1
`;
  
  const term: ParsedTerm = {
    title: 'API',
    abbrev: '',
    description: 'This is an API description in English',
    tags: ['ويب'],
    arabicWords: [
      { word: 'واجهة', approvedBy: ['user1'] }
    ]
  };
  
  const errors = validateTermStructure(term, content, 'api.md');
  assertEquals(errors.length, 1);
  assertEquals(errors[0].type, 'content');
  assertEquals(errors[0].message.includes('Arabic'), true);
});

Deno.test("validateTermStructure - detects missing tags", () => {
  const content = `# API

## Description
واجهة برمجة

## Tags

# Arabic Words

## واجهة
### Approved By
- user1
`;
  
  const term: ParsedTerm = {
    title: 'API',
    abbrev: '',
    description: 'واجهة برمجة',
    tags: [],
    arabicWords: [
      { word: 'واجهة', approvedBy: ['user1'] }
    ]
  };
  
  const errors = validateTermStructure(term, content, 'api.md');
  assertEquals(errors.length, 1);
  assertEquals(errors[0].type, 'required');
  assertEquals(errors[0].message.includes('tag'), true);
});

Deno.test("validateTermStructure - detects non-Arabic tags", () => {
  const content = `# API

## Description
واجهة برمجة

## Tags
- web
- architecture

# Arabic Words

## واجهة
### Approved By
- user1
`;
  
  const term: ParsedTerm = {
    title: 'API',
    abbrev: '',
    description: 'واجهة برمجة',
    tags: ['web', 'architecture'],
    arabicWords: [
      { word: 'واجهة', approvedBy: ['user1'] }
    ]
  };
  
  const errors = validateTermStructure(term, content, 'api.md');
  assertEquals(errors.length, 1);
  assertEquals(errors[0].type, 'content');
  assertEquals(errors[0].message.includes('Arabic'), true);
});

Deno.test("validateTermStructure - detects missing Arabic words", () => {
  const content = `# API

## Description
واجهة برمجة

## Tags
- ويب

# Arabic Words
`;
  
  const term: ParsedTerm = {
    title: 'API',
    abbrev: '',
    description: 'واجهة برمجة',
    tags: ['ويب'],
    arabicWords: []
  };
  
  const errors = validateTermStructure(term, content, 'api.md');
  assertEquals(errors.length, 1);
  assertEquals(errors[0].type, 'required');
  assertEquals(errors[0].message.includes('Arabic word'), true);
});

Deno.test("validateTermStructure - detects missing approvers", () => {
  const content = `# API

## Description
واجهة برمجة

## Tags
- ويب

# Arabic Words

## واجهة
### Approved By
`;
  
  const term: ParsedTerm = {
    title: 'API',
    abbrev: '',
    description: 'واجهة برمجة',
    tags: ['ويب'],
    arabicWords: [
      { word: 'واجهة', approvedBy: [] }
    ]
  };
  
  const errors = validateTermStructure(term, content, 'api.md');
  assertEquals(errors.length, 1);
  assertEquals(errors[0].type, 'required');
  assertEquals(errors[0].message.includes('approver'), true);
});

Deno.test("validateTermStructure - detects non-Arabic Arabic words", () => {
  const content = `# API

## Description
واجهة برمجة

## Tags
- ويب

# Arabic Words

## API Interface
### Approved By
- user1
`;
  
  const term: ParsedTerm = {
    title: 'API',
    abbrev: '',
    description: 'واجهة برمجة',
    tags: ['ويب'],
    arabicWords: [
      { word: 'API Interface', approvedBy: ['user1'] }
    ]
  };
  
  const errors = validateTermStructure(term, content, 'api.md');
  assertEquals(errors.length, 1);
  assertEquals(errors[0].type, 'content');
  assertEquals(errors[0].message.includes('Arabic'), true);
});

Deno.test("validateTermStructure - validates multiple Arabic words", () => {
  const content = `# API

## Description
واجهة برمجة

## Tags
- ويب

# Arabic Words

## واجهة برمجة التطبيقات
### Approved By
- user1
- user2

## الواجهة البرمجية
### Approved By
- user3
`;
  
  const term: ParsedTerm = {
    title: 'API',
    abbrev: '',
    description: 'واجهة برمجة',
    tags: ['ويب'],
    arabicWords: [
      { word: 'واجهة برمجة التطبيقات', approvedBy: ['user1', 'user2'] },
      { word: 'الواجهة البرمجية', approvedBy: ['user3'] }
    ]
  };
  
  const errors = validateTermStructure(term, content, 'api.md');
  assertEquals(errors.length, 0);
});

Deno.test("validateFile - validates valid markdown file", async () => {
  const tempDir = await Deno.makeTempDir();
  const filePath = `${tempDir}/test.md`;
  
  const content = `# API

## Description
واجهة برمجة التطبيقات

## Tags
- ويب
- معمارية

# Arabic Words

## واجهة برمجة التطبيقات
### Approved By
- user1
`;
  
  await Deno.writeTextFile(filePath, content);
  
  const result = await validateFile(filePath, 'test.md');
  assertEquals(result.valid, true);
  assertEquals(result.file, 'test.md');
  assertEquals(result.errors.length, 0);
  assertExists(result.data);
  assertEquals(result.data!.title, 'API');
  assertEquals(result.data!.tagsCount, 2);
  assertEquals(result.data!.arabicWordsCount, 1);
  
  await Deno.remove(tempDir, { recursive: true });
});

Deno.test("validateFile - detects invalid markdown file", async () => {
  const tempDir = await Deno.makeTempDir();
  const filePath = `${tempDir}/test.md`;
  
  const content = `# API

## Description
API description in English

## Tags
- web

# Arabic Words

## Interface
### Approved By
- user1
`;
  
  await Deno.writeTextFile(filePath, content);
  
  const result = await validateFile(filePath, 'test.md');
  assertEquals(result.valid, false);
  assertEquals(result.file, 'test.md');
  assertEquals(result.errors.length > 0, true);
  
  await Deno.remove(tempDir, { recursive: true });
});

Deno.test("validateFile - handles parse errors", async () => {
  const tempDir = await Deno.makeTempDir();
  const filePath = `${tempDir}/test.md`;
  
  await Deno.writeTextFile(filePath, '');
  
  const result = await validateFile(filePath, 'test.md');
  assertEquals(result.valid, false);
  assertEquals(result.errors.length > 0, true);
  assertEquals(result.errors[0].type, 'required');
  
  await Deno.remove(tempDir, { recursive: true });
});

Deno.test("findMarkdownFiles - finds markdown files recursively", async () => {
  const tempDir = await Deno.makeTempDir();
  
  await Deno.mkdir(`${tempDir}/tech`);
  await Deno.mkdir(`${tempDir}/programming`);
  
  await Deno.writeTextFile(`${tempDir}/tech/api.md`, '# API');
  await Deno.writeTextFile(`${tempDir}/tech/http.md`, '# HTTP');
  await Deno.writeTextFile(`${tempDir}/programming/algorithm.md`, '# Algorithm');
  await Deno.writeTextFile(`${tempDir}/readme.txt`, 'Not a markdown file');
  
  const files = await findMarkdownFiles(tempDir);
  assertEquals(files.length, 3);
  
  const names = files.map((f: FileInfo) => f.name).sort();
  assertEquals(names, ['algorithm.md', 'api.md', 'http.md']);
  
  await Deno.remove(tempDir, { recursive: true });
});

Deno.test("findMarkdownFiles - returns empty for no markdown files", async () => {
  const tempDir = await Deno.makeTempDir();
  
  await Deno.writeTextFile(`${tempDir}/readme.txt`, 'Not markdown');
  await Deno.mkdir(`${tempDir}/subdir`);
  
  const files = await findMarkdownFiles(tempDir);
  assertEquals(files.length, 0);
  
  await Deno.remove(tempDir, { recursive: true });
});

Deno.test("findMarkdownFiles - throws for non-existent directory", async () => {
  let threw = false;
  try {
    await findMarkdownFiles('/non/existent/path');
  } catch (error) {
    threw = true;
    const err = error as Error;
    assertEquals(err.message.includes('Cannot read directory'), true);
  }
  assertEquals(threw, true);
});
