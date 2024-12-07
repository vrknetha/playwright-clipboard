import { Page } from '@playwright/test';

export interface ClipboardOptions {
  timeout?: number;
}

export enum ClipboardError {
  COPY_ERROR = 'Copy operation failed',
  PASTE_ERROR = 'Paste operation failed',
  CLIPBOARD_ACCESS_DENIED = 'Cannot access clipboard',
  SELECTION_FAILED = 'Text selection failed',
  INVALID_WORD_INDEX = 'Invalid word index specified',
  WORD_BOUNDARY_ERROR = 'Cannot determine word boundaries',
  EMPTY_SELECTION = 'No text selected',
  PASTE_POSITION_ERROR = 'Invalid paste position',
}

export class PlaywrightClipboard {
  private page: Page;
  private options: ClipboardOptions;

  constructor(page: Page, options: ClipboardOptions = {}) {
    this.page = page;
    this.options = options;
  }

  async copy(selector: string): Promise<void> {
    try {
      const text = await this.page.inputValue(selector);
      if (!text.trim()) {
        throw new Error(ClipboardError.EMPTY_SELECTION);
      }
      await this.page.focus(selector);
      await this.page.keyboard.press('Meta+A');
      await this.page.keyboard.press('Meta+C');
    } catch (error) {
      throw new Error(ClipboardError.COPY_ERROR);
    }
  }

  async paste(selector: string): Promise<void> {
    try {
      await this.page.focus(selector);
      await this.page.keyboard.press('Meta+V');
    } catch (error) {
      throw new Error(ClipboardError.PASTE_ERROR);
    }
  }

  async cut(selector: string): Promise<void> {
    try {
      await this.page.focus(selector);
      await this.page.keyboard.press('Meta+A');
      await this.page.keyboard.press('Meta+X');
    } catch (error) {
      throw new Error(ClipboardError.COPY_ERROR);
    }
  }

  async copyRichText(selector: string): Promise<void> {
    try {
      const browserName = this.page.context().browser()?.browserType().name();

      // First select the content
      await this.page.click(selector);
      await this.page.keyboard.press('Meta+A');

      if (browserName === 'webkit') {
        // WebKit: Try clipboard API first, then fallback to execCommand
        await this.page.evaluate(async sel => {
          const element = document.querySelector(sel);
          if (!element) throw new Error('Element not found');

          try {
            const text = element.textContent || '';
            await navigator.clipboard.writeText(text);
          } catch (e) {
            // Fallback to execCommand
            const selection = window.getSelection();
            const range = document.createRange();
            range.selectNodeContents(element);
            selection?.removeAllRanges();
            selection?.addRange(range);
            document.execCommand('copy');
          }
        }, selector);
      } else {
        // Other browsers: Use keyboard shortcut
        await this.page.keyboard.press('Meta+C');
      }
    } catch (error) {
      throw new Error(ClipboardError.COPY_ERROR);
    }
  }

  async pasteRichText(selector: string): Promise<void> {
    try {
      const browserName = this.page.context().browser()?.browserType().name();

      if (browserName === 'webkit') {
        // Firstfocus the target element
        await this.page.click(selector);

        // Try keyboard shortcut first
        await this.page.keyboard.press('Meta+V');

        // Then verify and fallback if needed
        await this.page.evaluate(async sel => {
          const element = document.querySelector(sel);
          if (!element || !(element instanceof HTMLElement)) throw new Error('Element not found');

          // If no content after keyboard shortcut, try clipboard API
          if (!element.textContent) {
            try {
              const text = await navigator.clipboard.readText();
              if (text) {
                element.textContent = text;
                element.dispatchEvent(new Event('input', { bubbles: true }));
                element.dispatchEvent(new Event('change', { bubbles: true }));
              }
            } catch (e) {
              // If clipboard API fails, try execCommand
              element.focus();
              document.execCommand('paste');
              element.dispatchEvent(new Event('input', { bubbles: true }));
              element.dispatchEvent(new Event('change', { bubbles: true }));
            }
          }
        }, selector);
      } else {
        // First focus the target element
        await this.page.click(selector);
        // Other browsers: Use keyboard shortcut
        await this.page.keyboard.press('Meta+V');
      }
    } catch (error) {
      throw new Error(ClipboardError.PASTE_ERROR);
    }
  }

  async cutRichText(selector: string): Promise<void> {
    try {
      const browserName = this.page.context().browser()?.browserType().name();

      // First select the content
      await this.page.click(selector);
      await this.page.keyboard.press('Meta+A');

      if (browserName === 'webkit') {
        // WebKit: Try clipboard API first, then fallback to execCommand
        await this.page.evaluate(async sel => {
          const element = document.querySelector(sel);
          if (!element) throw new Error('Element not found');

          try {
            const text = element.textContent || '';
            await navigator.clipboard.writeText(text);
            element.textContent = '';
          } catch (e) {
            // Fallback to execCommand
            const selection = window.getSelection();
            const range = document.createRange();
            range.selectNodeContents(element);
            selection?.removeAllRanges();
            selection?.addRange(range);
            document.execCommand('cut');
          }
        }, selector);
      } else {
        // Other browsers: Use keyboard shortcut
        await this.page.keyboard.press('Meta+X');
      }

      // Ensure content is cleared in all browsers
      await this.page.evaluate(sel => {
        const element = document.querySelector(sel);
        if (!element) throw new Error('Element not found');
        element.textContent = '';
        element.innerHTML = '';
      }, selector);
    } catch (error) {
      throw new Error(ClipboardError.COPY_ERROR);
    }
  }

  async getClipboardContent(): Promise<string> {
    try {
      return await this.page.evaluate(() => navigator.clipboard.readText());
    } catch (error) {
      throw new Error(ClipboardError.CLIPBOARD_ACCESS_DENIED);
    }
  }

  async setClipboardContent(text: string): Promise<void> {
    try {
      await this.page.evaluate(text => navigator.clipboard.writeText(text), text);
    } catch (error) {
      throw new Error(ClipboardError.CLIPBOARD_ACCESS_DENIED);
    }
  }

  async selectAll(selector: string): Promise<void> {
    try {
      await this.page.focus(selector);
      await this.page.keyboard.press('Meta+A');
    } catch (error) {
      throw new Error(ClipboardError.SELECTION_FAILED);
    }
  }

  async select(selector: string, start: number, end: number): Promise<void> {
    try {
      await this.page.focus(selector);
      await this.page.evaluate(
        ({ sel, startPos, endPos }) => {
          const element = document.querySelector(sel);
          if (!element) throw new Error('Element not found');

          // Ensure element is focused
          if (element instanceof HTMLElement) {
            element.focus();
          }

          if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
            // For input/textarea elements, use setSelectionRange
            element.setSelectionRange(startPos, endPos);
            // Dispatch input and select events
            element.dispatchEvent(new Event('select', { bubbles: true }));
          } else {
            const range = document.createRange();
            const selection = window.getSelection();
            if (!selection) throw new Error('Selection failed');

            // Handle text nodes
            if (element.firstChild && element.firstChild.nodeType === Node.TEXT_NODE) {
              range.setStart(element.firstChild, startPos);
              range.setEnd(element.firstChild, endPos);
            } else {
              range.selectNodeContents(element);
            }

            selection.removeAllRanges();
            selection.addRange(range);
          }
        },
        { sel: selector, startPos: start, endPos: end }
      );

      // Wait a moment for selection to take effect
      await this.page.waitForTimeout(100);
    } catch (error) {
      throw new Error(ClipboardError.SELECTION_FAILED);
    }
  }

  async getSelectedText(): Promise<string> {
    try {
      return await this.page.evaluate(() => {
        const element = document.activeElement;
        if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
          // For input/textarea elements, use selectionStart/selectionEnd
          return element.value.substring(element.selectionStart || 0, element.selectionEnd || 0);
        }
        // For other elements, use window.getSelection()
        const selection = window.getSelection();
        if (!selection) return '';
        return selection.toString();
      });
    } catch (error) {
      throw new Error(ClipboardError.SELECTION_FAILED);
    }
  }

  async copyBetweenWords(
    selector: string,
    startWordIndex: number,
    endWordIndex: number
  ): Promise<void> {
    try {
      const text = await this.page.inputValue(selector);
      const words = text.split(/\s+/);

      if (startWordIndex < 0 || endWordIndex >= words.length || startWordIndex > endWordIndex) {
        throw new Error(ClipboardError.INVALID_WORD_INDEX);
      }

      const selectedWords = words.slice(startWordIndex, endWordIndex + 1).join(' ');
      await this.setClipboardContent(selectedWords);
    } catch (error) {
      throw new Error(ClipboardError.COPY_ERROR);
    }
  }

  async pasteAfterWord(selector: string, wordIndex: number): Promise<void> {
    try {
      const text = await this.page.inputValue(selector);
      const words = text.split(/\s+/);

      if (wordIndex < 0 || wordIndex >= words.length) {
        throw new Error(ClipboardError.INVALID_WORD_INDEX);
      }

      const clipboardText = await this.getClipboardContent();
      const beforeWords = words.slice(0, wordIndex + 1);
      const afterWords = words.slice(wordIndex + 1);

      const newText = [...beforeWords, clipboardText, ...afterWords].join(' ');
      await this.page.fill(selector, newText);
    } catch (error) {
      throw new Error(ClipboardError.PASTE_POSITION_ERROR);
    }
  }

  async pasteBeforeWord(selector: string, wordIndex: number): Promise<void> {
    try {
      const text = await this.page.inputValue(selector);
      const words = text.split(/\s+/);

      if (wordIndex < 0 || wordIndex >= words.length) {
        throw new Error(ClipboardError.INVALID_WORD_INDEX);
      }

      const clipboardText = await this.getClipboardContent();
      const beforeWords = words.slice(0, wordIndex);
      const afterWords = words.slice(wordIndex);

      const newText = [...beforeWords, clipboardText, ...afterWords].join(' ');
      await this.page.fill(selector, newText);
    } catch (error) {
      throw new Error(ClipboardError.PASTE_POSITION_ERROR);
    }
  }

  async replaceWord(selector: string, wordIndex: number): Promise<void> {
    try {
      const text = await this.page.inputValue(selector);
      const words = text.split(/\s+/);

      if (wordIndex < 0 || wordIndex >= words.length) {
        throw new Error(ClipboardError.INVALID_WORD_INDEX);
      }

      const clipboardText = await this.getClipboardContent();
      const beforeWords = words.slice(0, wordIndex);
      const afterWords = words.slice(wordIndex + 1);

      const newText = [...beforeWords, clipboardText, ...afterWords].join(' ');
      await this.page.fill(selector, newText);
    } catch (error) {
      throw new Error(ClipboardError.PASTE_POSITION_ERROR);
    }
  }

  async selectWordRange(selector: string, startIndex: number, endIndex: number): Promise<void> {
    try {
      const text = await this.page.inputValue(selector);
      const words = text.split(/\s+/);

      if (startIndex < 0 || endIndex >= words.length || startIndex > endIndex) {
        throw new Error(ClipboardError.INVALID_WORD_INDEX);
      }

      const startPos = words.slice(0, startIndex).join(' ').length + (startIndex > 0 ? 1 : 0);
      const endPos = startPos + words.slice(startIndex, endIndex + 1).join(' ').length;

      await this.select(selector, startPos, endPos);
    } catch (error) {
      throw new Error(ClipboardError.SELECTION_FAILED);
    }
  }

  async getSelectedWords(): Promise<string> {
    try {
      return await this.page.evaluate(() => {
        const selection = window.getSelection();
        return selection ? selection.toString() : '';
      });
    } catch (error) {
      throw new Error(ClipboardError.EMPTY_SELECTION);
    }
  }

  async getWordBoundaries(
    selector: string,
    wordIndex: number
  ): Promise<{ start: number; end: number }> {
    try {
      const text = await this.page.inputValue(selector);
      const words = text.split(/\s+/);

      if (wordIndex < 0 || wordIndex >= words.length) {
        throw new Error('Word index out of bounds');
      }

      const start = words.slice(0, wordIndex).join(' ').length + (wordIndex > 0 ? 1 : 0);
      const end = start + words[wordIndex].length;

      return { start, end };
    } catch (error) {
      throw new Error(ClipboardError.WORD_BOUNDARY_ERROR);
    }
  }
}
