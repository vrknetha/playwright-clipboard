import { test, expect } from '@playwright/test';
import { PlaywrightClipboard } from '../src';

test.describe('PlaywrightClipboard', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the test page
    await page.goto('http://localhost:8080');
  });

  // Configure timeouts for clipboard operations
  test.setTimeout(30000);

  test('should perform basic copy/paste operations', async ({ page }): Promise<void> => {
    const clipboard = new PlaywrightClipboard(page);
    const initialText = 'Hello World';

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

  test('should handle rich text operations', async ({ page }): Promise<void> => {
    const clipboard = new PlaywrightClipboard(page);
    const richText = 'This is <b>bold</b> text';

    // Using $eval because richSource is a contenteditable div, not a form input
    await page.$eval(
      '#richSource',
      (el: HTMLElement, html: string) => {
        el.innerHTML = html;
      },
      richText
    );

    await clipboard.copyRichText('#richSource');
    await clipboard.pasteRichText('#richTarget');

    // Using innerText to get the rendered text without HTML tags
    const result = await page.$eval('#richTarget', (el: HTMLElement) => {
      // Log the exact content for debugging
      console.log('Raw content:', JSON.stringify(el.innerText));
      console.log('Content length:', el.innerText.length);
      return el.innerText;
    });

    const expectedText = 'This is bold text';
    console.log('Expected:', JSON.stringify(expectedText));
    console.log('Expected length:', expectedText.length);

    // Compare after normalizing whitespace
    expect(result.replace(/\s+/g, ' ').trim()).toBe(expectedText);
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

    await page.fill('#editor', testText);
    await clipboard.copy('#editor');
    await clipboard.paste('#target');

    const result = await page.inputValue('#target');
    expect(result).toBe(testText);
  });
});
