import { test, expect } from '@playwright/test';
import { PlaywrightClipboard } from '../src';

// Helper function to normalize HTML for comparison
function normalizeHtml(html: string): string {
  return html
    .replace(/\s+/g, ' ')
    .replace(/>\s+</g, '><')
    .replace(/&nbsp;/g, ' ')
    .trim();
}

test.describe('PlaywrightClipboard', () => {
  test.beforeEach(async ({ context, browserName, page }) => {
    // Grant clipboard permissions based on browser
    if (browserName === 'chromium') {
      await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    }
    // Navigate to the test page
    await page.goto('http://localhost:8080');
  });

  test('should perform basic copy/paste operations', async ({ page }): Promise<void> => {
    const clipboard = new PlaywrightClipboard(page);
    const initialText = 'Hello World';

    // Set initial text in source
    await page.fill('#source', initialText);
    expect(await page.inputValue('#source')).toBe(initialText);

    await clipboard.copy('#source');
    await clipboard.paste('#target');

    const result = await page.inputValue('#target');
    expect(result).toBe(initialText);
  });

  test('should handle cut operations', async ({ page }): Promise<void> => {
    const clipboard = new PlaywrightClipboard(page);
    const initialText = 'Test Content';

    await page.fill('#source', initialText);
    await clipboard.cut('#source');
    await clipboard.paste('#target');

    const sourceContent = await page.inputValue('#source');
    expect(sourceContent).toBe('');

    const targetContent = await page.inputValue('#target');
    expect(targetContent).toBe(initialText);
  });

  test('should handle text selection', async ({ page }): Promise<void> => {
    const clipboard = new PlaywrightClipboard(page);
    const testText = 'Select this text';

    await page.fill('#text', testText);
    await clipboard.select('#text', 7, 11); // Selects "this"
    const selectedText = await clipboard.getSelectedText();
    expect(selectedText).toBe('this');
  });

  test('should handle word operations', async ({ page }): Promise<void> => {
    const clipboard = new PlaywrightClipboard(page);
    const testText = 'The quick brown fox jumps';

    await page.fill('#editor', testText);
    await clipboard.copyBetweenWords('#editor', 2, 3); // Copy "brown fox"
    await clipboard.paste('#target');

    const targetContent = await page.inputValue('#target');
    expect(targetContent).toBe('brown fox');
  });

  test('should handle rich text operations', async ({ page, browserName }): Promise<void> => {
    const clipboard = new PlaywrightClipboard(page);
    const richText = 'This is <b>bold</b> text';

    await page.evaluate(text => {
      const editor = document.querySelector('#richSource') as HTMLElement;
      editor.innerHTML = text;
    }, richText);

    await clipboard.copyRichText('#richSource');
    await clipboard.pasteRichText('#richTarget');

    const result = await page.evaluate(() => {
      const target = document.querySelector('#richTarget') as HTMLElement;
      return target.innerHTML.trim();
    });

    if (browserName === 'webkit') {
      const plainText = await page.evaluate(() => {
        const target = document.querySelector('#richTarget') as HTMLElement;
        return target.textContent?.trim() || '';
      });
      const normalizedExpected = 'This is bold text';
      const normalizedActual = plainText.replace(/\s+/g, ' ').trim();
      expect(normalizedActual).toBe(normalizedExpected);
    } else {
      // Chromium should preserve the HTML structure
      const normalizedExpected = richText.replace(/\s+/g, ' ').trim();
      const normalizedResult = normalizeHtml(result);
      expect(normalizedResult).toBe(normalizedExpected);
    }
  });

  test('should handle empty text selection', async ({ page }): Promise<void> => {
    const clipboard = new PlaywrightClipboard(page);
    await page.fill('#text', '');
    await clipboard.select('#text', 0, 0);
    const selectedText = await clipboard.getSelectedText();
    expect(selectedText).toBe('');
  });

  test('should handle special characters', async ({ page }): Promise<void> => {
    const clipboard = new PlaywrightClipboard(page);
    const testText = 'Special @#$% characters!';

    await page.fill('#source', testText);
    await clipboard.copy('#source');
    await clipboard.paste('#target');

    const result = await page.inputValue('#target');
    expect(result).toBe(testText);
  });

  test('should handle multiline text', async ({ page }): Promise<void> => {
    const clipboard = new PlaywrightClipboard(page);
    const testText = 'Line 1\nLine 2\nLine 3';

    // Use textarea for multiline text
    await page.evaluate(text => {
      const textarea = document.querySelector('#editor') as HTMLTextAreaElement;
      textarea.value = text;
    }, testText);

    await clipboard.copy('#editor');
    await clipboard.paste('#target');

    const result = await page.evaluate(() => {
      const target = document.querySelector('#target') as HTMLInputElement;
      return target.value;
    });
    expect(result).toBe(testText);
  });
});
