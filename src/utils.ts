import { Page } from '@playwright/test';
import { ClipboardError } from './types';

export async function copyToClipboard(page: Page, selector: string): Promise<void> {
  try {
    const text = await page.inputValue(selector);
    if (!text.trim()) {
      throw new Error(ClipboardError.EMPTY_SELECTION);
    }

    const browserName = page.context().browser()?.browserType().name();
    if (browserName === 'chromium') {
      await setClipboardContent(page, text);
    } else {
      // Firefox and WebKit: Use keyboard shortcuts
      const modifierKey = process.platform === 'darwin' ? 'Meta' : 'Control';
      await page.focus(selector);
      await page.keyboard.press(`${modifierKey}+A`);
      await page.waitForTimeout(100);
      await page.keyboard.press(`${modifierKey}+C`);
      await page.waitForTimeout(100);
    }
  } catch (error) {
    throw new Error(ClipboardError.COPY_ERROR);
  }
}

export async function pasteFromClipboard(page: Page, selector: string): Promise<void> {
  try {
    const browserName = page.context().browser()?.browserType().name();
    if (browserName === 'chromium') {
      const text = await getClipboardContent(page);
      await page.fill(selector, text);
    } else {
      // Firefox and WebKit: Use keyboard shortcuts
      const modifierKey = process.platform === 'darwin' ? 'Meta' : 'Control';
      await page.focus(selector);
      await page.keyboard.press(`${modifierKey}+A`);
      await page.waitForTimeout(100);
      await page.keyboard.press(`${modifierKey}+V`);
      await page.waitForTimeout(100);
    }
  } catch (error) {
    throw new Error(ClipboardError.PASTE_ERROR);
  }
}

export async function cutToClipboard(page: Page, selector: string): Promise<void> {
  try {
    const browserName = page.context().browser()?.browserType().name();
    if (browserName === 'chromium') {
      const text = await page.inputValue(selector);
      await setClipboardContent(page, text);
      await page.fill(selector, '');
    } else {
      // Firefox and WebKit: Use keyboard shortcuts
      const modifierKey = process.platform === 'darwin' ? 'Meta' : 'Control';
      await page.focus(selector);
      await page.keyboard.press(`${modifierKey}+A`);
      await page.waitForTimeout(100);
      await page.keyboard.press(`${modifierKey}+X`);
      await page.waitForTimeout(100);
    }
  } catch (error) {
    throw new Error(ClipboardError.COPY_ERROR);
  }
}

export async function copyRichText(page: Page, selector: string): Promise<void> {
  try {
    const browserName = page.context().browser()?.browserType().name();

    if (browserName === 'chromium') {
      const text = await page.evaluate((sel: string) => {
        const element = document.querySelector(sel);
        if (!element) throw new Error('Element not found');
        return element.innerHTML;
      }, selector);
      await setClipboardContent(page, text);
    } else {
      // Firefox and WebKit: Use keyboard shortcuts
      const modifierKey = process.platform === 'darwin' ? 'Meta' : 'Control';
      await page.focus(selector);
      await page.keyboard.press(`${modifierKey}+A`);
      await page.waitForTimeout(100);
      await page.keyboard.press(`${modifierKey}+C`);
      await page.waitForTimeout(100);
    }
  } catch (error) {
    throw new Error(ClipboardError.COPY_ERROR);
  }
}

export async function pasteRichText(page: Page, selector: string): Promise<void> {
  try {
    const browserName = page.context().browser()?.browserType().name();

    if (browserName === 'chromium') {
      const text = await getClipboardContent(page);
      await page.evaluate(
        ({ sel, content }: { sel: string; content: string }) => {
          const element = document.querySelector(sel);
          if (!element || !(element instanceof HTMLElement)) {
            throw new Error('Element not found');
          }
          element.innerHTML = content;
          element.dispatchEvent(new Event('input', { bubbles: true }));
          element.dispatchEvent(new Event('change', { bubbles: true }));
        },
        { sel: selector, content: text }
      );
    } else {
      // Firefox and WebKit: Use keyboard shortcuts
      const modifierKey = process.platform === 'darwin' ? 'Meta' : 'Control';
      await page.focus(selector);
      await page.keyboard.press(`${modifierKey}+A`);
      await page.waitForTimeout(100);
      await page.keyboard.press(`${modifierKey}+V`);
      await page.waitForTimeout(100);
    }
  } catch (error) {
    throw new Error(ClipboardError.PASTE_ERROR);
  }
}

export async function cutRichText(page: Page, selector: string): Promise<void> {
  try {
    const browserName = page.context().browser()?.browserType().name();

    if (browserName === 'chromium') {
      const text = await page.evaluate((sel: string) => {
        const element = document.querySelector(sel);
        if (!element) throw new Error('Element not found');
        const content = element.innerHTML;
        element.innerHTML = '';
        return content;
      }, selector);
      await setClipboardContent(page, text);
    } else {
      // Firefox and WebKit: Use keyboard shortcuts
      const modifierKey = process.platform === 'darwin' ? 'Meta' : 'Control';
      await page.focus(selector);
      await page.keyboard.press(`${modifierKey}+A`);
      await page.waitForTimeout(100);
      await page.keyboard.press(`${modifierKey}+X`);
      await page.waitForTimeout(100);
    }
  } catch (error) {
    throw new Error(ClipboardError.COPY_ERROR);
  }
}

export async function getClipboardContent(page: Page): Promise<string> {
  try {
    const browserName = page.context().browser()?.browserType().name();
    if (browserName === 'chromium') {
      return await page.evaluate(() => navigator.clipboard.readText());
    } else {
      // Firefox and WebKit: Use keyboard shortcuts and a temporary input
      const tempSelector = '#__clipboard_temp__';
      await page.evaluate(() => {
        const temp = document.createElement('textarea');
        temp.id = '__clipboard_temp__';
        temp.style.position = 'fixed';
        temp.style.top = '0';
        temp.style.left = '0';
        temp.style.opacity = '0';
        document.body.appendChild(temp);
      });
      
      const modifierKey = process.platform === 'darwin' ? 'Meta' : 'Control';
      await page.focus(tempSelector);
      await page.keyboard.press(`${modifierKey}+V`);
      await page.waitForTimeout(100);
      
      const text = await page.inputValue(tempSelector);
      
      await page.evaluate(() => {
        const temp = document.querySelector('#__clipboard_temp__');
        if (temp) temp.remove();
      });
      
      return text;
    }
  } catch (error) {
    throw new Error(ClipboardError.CLIPBOARD_ACCESS_DENIED);
  }
}

export async function setClipboardContent(page: Page, text: string): Promise<void> {
  try {
    const browserName = page.context().browser()?.browserType().name();
    if (browserName === 'chromium') {
      await page.evaluate((text: string) => navigator.clipboard.writeText(text), text);
    } else {
      // Firefox and WebKit: Use keyboard shortcuts and a temporary input
      const tempSelector = '#__clipboard_temp__';
      await page.evaluate((text: string) => {
        const temp = document.createElement('textarea');
        temp.id = '__clipboard_temp__';
        temp.style.position = 'fixed';
        temp.style.top = '0';
        temp.style.left = '0';
        temp.style.opacity = '0';
        temp.value = text;
        document.body.appendChild(temp);
      }, text);
      
      const modifierKey = process.platform === 'darwin' ? 'Meta' : 'Control';
      await page.focus(tempSelector);
      await page.keyboard.press(`${modifierKey}+A`);
      await page.waitForTimeout(100);
      await page.keyboard.press(`${modifierKey}+C`);
      await page.waitForTimeout(100);
      
      await page.evaluate(() => {
        const temp = document.querySelector('#__clipboard_temp__');
        if (temp) temp.remove();
      });
    }
  } catch (error) {
    throw new Error(ClipboardError.CLIPBOARD_ACCESS_DENIED);
  }
} 