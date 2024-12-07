# Playwright Clipboard

A comprehensive solution for testing clipboard operations in web applications using Playwright. This package provides both standard clipboard operations and precise word-level text manipulation capabilities.

## Installation

```bash
npm install --save-dev playwright-clipboard
```

## Features

- Basic clipboard operations (copy, paste, cut)
- Rich text operations with HTML preservation
- Text selection operations with character and word-level control
- Word-level operations for precise text manipulation
- Clipboard content management with direct access
- Cross-browser compatibility (Chromium, Firefox, WebKit)
- TypeScript support with full type definitions
- Comprehensive error handling
- Fallback mechanisms for browser-specific limitations

## Examples

### Using with Fixtures

```typescript
import { test as base, expect } from '@playwright/test';
import { PlaywrightClipboard } from 'playwright-clipboard';

// Extend the base test fixture with clipboard
interface ClipboardFixtures {
  clipboard: PlaywrightClipboard;
}

const test = base.extend<ClipboardFixtures>({
  clipboard: async ({ page }, use) => {
    const clipboard = new PlaywrightClipboard(page);
    await use(clipboard);
  },
});

// Now use clipboard in your tests
test('using clipboard fixture', async ({ page, clipboard }) => {
  await page.goto('http://localhost:8080');
  
  // Use clipboard methods directly
  await clipboard.copy('#source');
  await clipboard.paste('#target');
  
  const result = await page.inputValue('#target');
  expect(result).toBe('Hello World');
});

// Test rich text with browser context
test('rich text with browser context', async ({ page, clipboard, browserName }) => {
  await page.goto('http://localhost:8080');
  
  await clipboard.copyRichText('#richSource');
  await clipboard.pasteRichText('#richTarget');
  
  if (browserName === 'webkit') {
    const text = await page.$eval('#richTarget', el => el.textContent?.trim() || '');
    expect(text).toBe('This is bold text');
  } else {
    const html = await page.$eval('#richTarget', el => el.innerHTML.trim());
    expect(html).toContain('<b>bold</b>');
  }
});

### Basic Operations

```typescript
import { test, expect } from '@playwright/test';
import { PlaywrightClipboard } from 'playwright-clipboard';

test('basic copy/paste operations', async ({ page }) => {
  const clipboard = new PlaywrightClipboard(page);
  
  await page.goto('http://localhost:8080');
  
  // Copy from source input and paste to target
  await clipboard.copy('#source');
  await clipboard.paste('#target');

  const result = await page.inputValue('#target');
  expect(result).toBe('Hello World');
});

test('cut operations', async ({ page }) => {
  const clipboard = new PlaywrightClipboard(page);
  const initialText = 'Test Content';

  await page.fill('#source', initialText);
  await clipboard.cut('#source');
  await clipboard.paste('#target');

  // Source should be empty after cut
  const sourceContent = await page.inputValue('#source');
  expect(sourceContent).toBe('');

  // Target should have the cut content
  const targetContent = await page.inputValue('#target');
  expect(targetContent).toBe(initialText);
});
```

### Rich Text Operations

```typescript
test('rich text operations', async ({ page, browserName }) => {
  const clipboard = new PlaywrightClipboard(page);
  
  // Copy rich text content
  await clipboard.copyRichText('#richSource');
  await clipboard.pasteRichText('#richTarget');

  const result = await page.$eval('#richTarget', el => el.innerHTML.trim());
  
  if (browserName === 'webkit') {
    // WebKit may handle rich text differently
    const plainText = await page.$eval('#richTarget', 
      el => el.textContent?.trim() || '');
    expect(plainText).toBe('This is bold text');
  } else {
    // Other browsers preserve HTML structure
    expect(result).toContain('<b>bold</b>');
  }
});
```

### Text Selection

```typescript
test('text selection', async ({ page }) => {
  const clipboard = new PlaywrightClipboard(page);
  const testText = 'Select this text';

  await page.fill('#text', testText);
  await clipboard.select('#text', 7, 11); // Selects "this"
  
  const selectedText = await clipboard.getSelectedText();
  expect(selectedText).toBe('this');
});
```

### Word Operations

```typescript
test('word operations', async ({ page }) => {
  const clipboard = new PlaywrightClipboard(page);
  const testText = 'The quick brown fox jumps';

  await page.fill('#editor', testText);
  await clipboard.copyBetweenWords('#editor', 2, 3); // Copy "brown fox"
  await clipboard.paste('#target');

  const targetContent = await page.inputValue('#target');
  expect(targetContent).toBe('brown fox');
});
```

### Special Characters and Multiline Text

```typescript
test('special characters', async ({ page }) => {
  const clipboard = new PlaywrightClipboard(page);
  const testText = 'Special @#$% characters!';

  await page.fill('#source', testText);
  await clipboard.copy('#source');
  await clipboard.paste('#target');

  const result = await page.inputValue('#target');
  expect(result).toBe(testText);
});

test('multiline text', async ({ page }) => {
  const clipboard = new PlaywrightClipboard(page);
  const testText = 'Line 1\nLine 2\nLine 3';

  await page.fill('#editor', testText);
  await clipboard.copy('#editor');
  await clipboard.paste('#target');

  const result = await page.inputValue('#target');
  expect(result).toBe(testText);
});
```

## Browser Support

| Feature | Chromium | Firefox | WebKit (Safari) |
|---------|----------|---------|-----------------|
| Basic Operations | Native Clipboard API | Keyboard Shortcuts | Clipboard API + Fallback |
| Rich Text | Full Support | Full Support | Full Support* |
| Word Operations | Full Support | Full Support | Full Support |

\* Uses `execCommand` fallback for some operations

## Technical Details

The package implements several fallback mechanisms to ensure consistent behavior across browsers:

1. **Clipboard Access**:
   - Primary: Native Clipboard API
   - Fallback: Keyboard shortcuts (Meta+C, Meta+V, Meta+X)
   - Last Resort: execCommand for WebKit

2. **Text Selection**:
   - Input/Textarea: Uses `setSelectionRange`
   - Rich Text: Uses `Range` and `Selection` APIs
   - Word-Level: Custom boundary detection

3. **Rich Text Handling**:
   - Preserves HTML structure where supported
   - Graceful degradation to plain text
   - Browser-specific optimizations

## API Reference

### Constructor

```typescript
constructor(page: Page, options?: ClipboardOptions)
```

Options:
- `timeout?: number` - Operation timeout in milliseconds (default: 5000)

### Methods

#### Basic Operations
- `copy(selector: string): Promise<void>` - Copy content from element
- `paste(selector: string): Promise<void>` - Paste content to element
- `cut(selector: string): Promise<void>` - Cut content from element

#### Rich Text Operations
- `copyRichText(selector: string): Promise<void>` - Copy with HTML preservation
- `pasteRichText(selector: string): Promise<void>` - Paste with HTML preservation
- `cutRichText(selector: string): Promise<void>` - Cut with HTML preservation

#### Selection Operations
- `selectAll(selector: string): Promise<void>` - Select all content
- `select(selector: string, start: number, end: number): Promise<void>` - Select range
- `getSelectedText(): Promise<string>` - Get selected text

#### Word Operations
- `copyBetweenWords(selector: string, startWordIndex: number, endWordIndex: number): Promise<void>`
- `pasteAfterWord(selector: string, wordIndex: number): Promise<void>`
- `pasteBeforeWord(selector: string, wordIndex: number): Promise<void>`
- `replaceWord(selector: string, wordIndex: number): Promise<void>`
- `selectWordRange(selector: string, startIndex: number, endIndex: number): Promise<void>`
- `getSelectedWords(): Promise<string>`

#### Clipboard Management
- `getClipboardContent(): Promise<string>` - Get current clipboard content
- `setClipboardContent(text: string): Promise<void>` - Set clipboard content

## Error Handling

The package includes comprehensive error handling with specific error types:

```typescript
export enum ClipboardError {
  COPY_ERROR = 'Copy operation failed',
  PASTE_ERROR = 'Paste operation failed',
  CLIPBOARD_ACCESS_DENIED = 'Cannot access clipboard',
  SELECTION_FAILED = 'Text selection failed',
  INVALID_WORD_INDEX = 'Invalid word index specified',
  WORD_BOUNDARY_ERROR = 'Cannot determine word boundaries',
  EMPTY_SELECTION = 'No text selected',
  PASTE_POSITION_ERROR = 'Invalid paste position'
}
```

## Requirements

- Node.js >= 18.0.0
- Playwright >= 1.40.0
- TypeScript >= 4.5.0 (for TypeScript users)

## Contributing

Contributions are welcome! Please read our [Contributing Guide](./CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

MIT

## Support

For bugs and feature requests, please [open an issue](https://github.com/vrknetha/playwright-clipboard/issues). 