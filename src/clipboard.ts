import { Page } from '@playwright/test';
import { ClipboardOptions, ClipboardError } from './types';
import {
  copyToClipboard,
  pasteFromClipboard,
  cutToClipboard,
  copyRichText,
  pasteRichText,
  cutRichText,
  getClipboardContent,
  setClipboardContent,
} from './utils';

export class PlaywrightClipboard {
  private page: Page;
  private options: ClipboardOptions;

  constructor(page: Page, options: ClipboardOptions = {}) {
    this.page = page;
    this.options = options;
  }

  async copy(selector: string): Promise<void> {
    await copyToClipboard(this.page, selector);
  }

  async paste(selector: string): Promise<void> {
    await pasteFromClipboard(this.page, selector);
  }

  async cut(selector: string): Promise<void> {
    await cutToClipboard(this.page, selector);
  }

  async copyRichText(selector: string): Promise<void> {
    await copyRichText(this.page, selector);
  }

  async pasteRichText(selector: string): Promise<void> {
    await pasteRichText(this.page, selector);
  }

  async cutRichText(selector: string): Promise<void> {
    await cutRichText(this.page, selector);
  }

  async getClipboardContent(): Promise<string> {
    return await getClipboardContent(this.page);
  }

  async setClipboardContent(text: string): Promise<void> {
    await setClipboardContent(this.page, text);
  }

  async selectAll(selector: string): Promise<void> {
    try {
      await this.page.focus(selector);
      await this.page.keyboard.press('Control+A');
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
