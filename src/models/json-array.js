/**
 * Helper to print a real JSON array with starting `[` and ending `]`
 */
export class JsonArray {
  constructor () {
    this._isFirst = true;
  }

  open () {
    process.stdout.write('[\n');
  }

  push (log) {
    if (this._isFirst) {
      this._isFirst = false;
    }
    else {
      process.stdout.write(',\n');
    }
    process.stdout.write(`  ${JSON.stringify(log)}`);
  }

  close () {
    process.stdout.write('\n]');
  }
}
