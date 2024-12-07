import { test, expect } from '@playwright/test';
import { PlaywrightClipboard } from '../src';

test.describe('PlaywrightClipboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080');
    // Clear both source and target elements
    await page.fill('#source', '');
    await page.fill('#target', '');
    await page.fill('#text', '');
    await page.fill('#editor', '');
    await page.evaluate(() => {
      const richSource = document.querySelector('#richSource');
      const richTarget = document.querySelector('#richTarget');
      if (richSource) richSource.innerHTML = '';
      if (richTarget) richTarget.innerHTML = '';
    });
  });

  test('should perform basic copy/paste operations', async ({ page }): Promise<void> => {
    const clipboard = new PlaywrightClipboard(page);
    const initialText = 'Hello World';
    await page.fill('#source', initialText);
    await clipboard.copy('#source');
    await clipboard.paste('#target');

    const result = await page.inputValue('#target');
    expect(result).toBe(initialText);
  });

  test('should handle cut operations', async ({ page }): Promise<void> => {
    const clipboard = new PlaywrightClipboard(page);
    const initialText = 'Test Content';

    // Clear source and target first
    await page.fill('#source', '');
    await page.fill('#target', '');
    // Then set test content
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
    await page.fill('#target', ''); // Clear target first
    await clipboard.paste('#target');

    const targetContent = await page.inputValue('#target');
    expect(targetContent).toBe('brown fox');
  });

  test('should handle rich text operations', async ({ page, browserName }): Promise<void> => {
    const clipboard = new PlaywrightClipboard(page);
    const richText = 'This is <b>bold</b> text';

    // Clear both source and target
    await page.evaluate(() => {
      const source = document.querySelector('#richSource');
      const target = document.querySelector('#richTarget');
      if (source) source.innerHTML = '';
      if (target) target.innerHTML = '';
    });

    // Set test content
    await page.evaluate(text => {
      const editor = document.querySelector('#richSource') as HTMLElement;
      editor.innerHTML = text;
    }, richText);

    await clipboard.copyRichText('#richSource');
    await clipboard.pasteRichText('#richTarget');

    if (browserName === 'webkit') {
      const plainText = await page.$eval('#richTarget', el => el.textContent?.trim() || '');
      expect(plainText).toBe('This is bold text');
    } else {
      const html = await page.$eval('#richTarget', el => el.innerHTML.trim());
      expect(html).toContain('<b>bold</b>');
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

    await page.fill('#editor', testText);
    await clipboard.copy('#editor');
    await clipboard.paste('#target');

    const result = await page.inputValue('#target');
    expect(result).toBe(testText);
  });
});
