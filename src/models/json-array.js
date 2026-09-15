/**
 * Helper to print a real JSON array with starting `[` and ending `]`
 */
export class JsonArray {
  constructor() {
    this._isFirst = true;
    this._isOpen = false;
  }

  // Streams emit "open" again after each reconnection, the array must only be opened once
  open() {
    if (this._isOpen) {
      return;
    }
    this._isOpen = true;
    process.stdout.write('[\n');
  }

  push(log) {
    if (this._isFirst) {
      this._isFirst = false;
    } else {
      process.stdout.write(',\n');
    }
    process.stdout.write(`  ${JSON.stringify(log)}`);
  }

  close() {
    if (!this._isOpen) {
      return;
    }
    this._isOpen = false;
    process.stdout.write('\n]');
  }
}
