# Playwright Clipboard

A comprehensive solution for testing clipboard operations in web applications using Playwright. This package provides both standard clipboard operations and precise word-level text manipulation capabilities.

## Installation

```bash
npm install --save-dev playwright-clipboard
```

## Features

- Basic clipboard operations (copy, paste, cut)
- Text selection operations
- Word-level operations
- Clipboard content management
- Cross-browser compatibility
- TypeScript support

## Usage

### Basic Operations

```typescript
import { test } from '@playwright/test';
import { PlaywrightClipboard } from 'playwright-clipboard';

test('basic clipboard operations', async ({ page }) => {
  const clipboard = new PlaywrightClipboard(page);

  // Copy text from source
  await clipboard.copy('#source');

  // Paste text to target
  await clipboard.paste('#target');

  // Cut text
  await clipboard.cut('#editor');

  // Get clipboard content
  const content = await clipboard.getClipboardContent();

  // Set clipboard content
  await clipboard.setClipboardContent('Hello World');
});
```

### Word-Level Operations

```typescript
test('word-level operations', async ({ page }) => {
  const clipboard = new PlaywrightClipboard(page);

  // Copy specific words
  await clipboard.copyBetweenWords('#editor', 1, 3);

  // Paste after a specific word
  await clipboard.pasteAfterWord('#editor', 2);

  // Paste before a specific word
  await clipboard.pasteBeforeWord('#editor', 0);

  // Replace a word
  await clipboard.replaceWord('#editor', 1);
});
```

### Selection Operations

```typescript
test('selection operations', async ({ page }) => {
  const clipboard = new PlaywrightClipboard(page);

  // Select all text
  await clipboard.selectAll('#editor');

  // Select specific range
  await clipboard.select('#editor', 0, 10);

  // Select word range
  await clipboard.selectWordRange('#editor', 1, 3);

  // Get selected text
  const selectedText = await clipboard.getSelectedWords();
});
```

## API Reference

### Constructor

```typescript
constructor(page: Page, options?: ClipboardOptions)
```

### Methods

- `copy(selector: string): Promise<void>`
- `paste(selector: string): Promise<void>`
- `cut(selector: string): Promise<void>`
- `getClipboardContent(): Promise<string>`
- `setClipboardContent(text: string): Promise<void>`
- `selectAll(selector: string): Promise<void>`
- `select(selector: string, start: number, end: number): Promise<void>`
- `copyBetweenWords(selector: string, startWordIndex: number, endWordIndex: number): Promise<void>`
- `pasteAfterWord(selector: string, wordIndex: number): Promise<void>`
- `pasteBeforeWord(selector: string, wordIndex: number): Promise<void>`
- `replaceWord(selector: string, wordIndex: number): Promise<void>`
- `selectWordRange(selector: string, startIndex: number, endIndex: number): Promise<void>`
- `getSelectedWords(): Promise<string>`
- `getWordBoundaries(selector: string, wordIndex: number): Promise<{ start: number; end: number }>`

## Error Handling

The package includes comprehensive error handling with specific error types:

- `COPY_ERROR`
- `PASTE_ERROR`
- `CLIPBOARD_ACCESS_DENIED`
- `SELECTION_FAILED`
- `INVALID_WORD_INDEX`
- `WORD_BOUNDARY_ERROR`
- `EMPTY_SELECTION`
- `PASTE_POSITION_ERROR`

## Requirements

- Node.js >= 18.0.0
- Playwright >= 1.40.0

## License

MIT 