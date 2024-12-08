# Playwright Clipboard

A comprehensive solution for testing clipboard operations in web applications using Playwright. This package provides both standard clipboard operations and precise word-level text manipulation capabilities across all major browsers (Chromium, Firefox, and WebKit).

## Features

- ✨ Cross-browser clipboard operations (copy, paste, cut)
- 📝 Rich text operations with HTML preservation
- 🎯 Text selection operations with character and word-level control
- 🔍 Word-level operations for precise text manipulation
- 🔄 Clipboard content management with direct access
- 🌐 Cross-browser compatibility (Chromium, Firefox, WebKit)
- 📦 TypeScript support with full type definitions
- 🛡️ Comprehensive error handling
- 🔄 Fallback mechanisms for browser-specific limitations

## Installation

```bash
npm install --save-dev playwright-clipboard
```

## Configuration

### Playwright Config

Create or update your `playwright.config.ts`:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  /* Run tests sequentially for clipboard operations */
  fullyParallel: false,
  use: {
    /* Base URL for your test server */
    baseURL: 'http://localhost:8080',
    /* Increase timeouts for clipboard operations */
    actionTimeout: 30000,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        /* Enable clipboard permissions for Chromium */
        permissions: ['clipboard-read', 'clipboard-write'],
      },
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        /* Firefox-specific preferences for clipboard */
        launchOptions: {
          firefoxUserPrefs: {
            'dom.events.testing.asyncClipboard': true,
            'dom.events.asyncClipboard.readText': true,
            'dom.events.asyncClipboard.clipboardItem': true,
            'dom.events.asyncClipboard.writeText': true,
            'permissions.default.clipboard-read': 1,
            'permissions.default.clipboard-write': 1,
          },
        },
      },
    },
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
      },
    },
  ],
});
```

## Usage

### Test Fixtures

Create reusable clipboard fixtures for your tests:

```typescript
import { test as base } from '@playwright/test';
import { PlaywrightClipboard } from 'playwright-clipboard';

// Define clipboard fixture type
interface ClipboardFixtures {
  clipboard: PlaywrightClipboard;
}

// Extend base test with clipboard fixture
const test = base.extend<ClipboardFixtures>({
  clipboard: async ({ page }, use) => {
    const clipboard = new PlaywrightClipboard(page);
    await use(clipboard);
  },
});

// Export for use in test files
export { test };
export { expect } from '@playwright/test';
```

### Basic Operations

```typescript
import { test, expect } from './fixtures';

test('basic clipboard operations', async ({ page, clipboard }) => {
  // Copy text
  await clipboard.copy('#source');
  
  // Paste text
  await clipboard.paste('#target');
  
  // Cut text
  await clipboard.cut('#source');
  
  // Get clipboard content
  const content = await clipboard.getClipboardContent();
  expect(content).toBe('Expected text');
});
```

### Rich Text Operations

```typescript
test('rich text operations', async ({ clipboard }) => {
  // Copy rich text with HTML preservation
  await clipboard.copyRichText('#richSource');
  
  // Paste rich text maintaining formatting
  await clipboard.pasteRichText('#richTarget');
  
  // Cut rich text
  await clipboard.cutRichText('#richSource');
});
```

### Text Selection

```typescript
test('text selection operations', async ({ clipboard }) => {
  // Select specific range
  await clipboard.select('#text', 7, 11);
  
  // Get selected text
  const selectedText = await clipboard.getSelectedText();
  
  // Select all text
  await clipboard.selectAll('#text');
  
  // Select word range
  await clipboard.selectWordRange('#text', 1, 3);
});
```

### Word Operations

```typescript
test('word-level operations', async ({ clipboard }) => {
  // Copy specific words
  await clipboard.copyBetweenWords('#editor', 2, 3);
  
  // Paste after specific word
  await clipboard.pasteAfterWord('#editor', 1);
  
  // Paste before word
  await clipboard.pasteBeforeWord('#editor', 0);
  
  // Replace specific word
  await clipboard.replaceWord('#editor', 4);
});
```

### Error Handling

```typescript
import { ClipboardError } from 'playwright-clipboard';

test('handle clipboard errors', async ({ clipboard }) => {
  try {
    await clipboard.copy('#nonexistent');
  } catch (error) {
    if (error.message === ClipboardError.COPY_ERROR) {
      // Handle copy error
    }
  }
});
```

## Browser Support

| Feature | Chromium | Firefox | WebKit |
|---------|----------|---------|--------|
| Basic Operations | ✅ | ✅ | ✅ |
| Rich Text | ✅ | ✅ | ✅ |
| Word Operations | ✅ | ✅ | ✅ |
| Text Selection | ✅ | ✅ | ✅ |

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

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see the [LICENSE](LICENSE) file for details
