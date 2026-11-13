/** A key of the keyboard, as sent by a terminal. Sending one runs the command in a terminal (see `runCli()`). */
export interface Key {
  /** Readable name, shown in the error messages. */
  name: string;
  /** Bytes a terminal sends for this key. */
  sequence: string;
}

function key(name: string, sequence: string): Key {
  return Object.freeze({ name, sequence });
}

/** Keys to send in `interactions`, for the prompts that read keys (select, checkbox) and to interrupt a prompt. */
export const KEYS = Object.freeze({
  ENTER: key('enter', '\r'),
  SPACE: key('space', ' '),
  UP: key('up', '\x1B[A'),
  DOWN: key('down', '\x1B[B'),
  CTRL_C: key('ctrl+c', '\x03'),
});

export function isKey(value: unknown): value is Key {
  return typeof value === 'object' && value != null && 'sequence' in value && 'name' in value;
}
