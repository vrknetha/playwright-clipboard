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
