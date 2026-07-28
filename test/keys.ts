// Keypress byte sequences for driving raw-mode prompts (select / checkbox /
// confirm) under PTY mode. Use as e.g. `send: keys.DOWN + keys.ENTER`.
export const keys = {
  UP: '\x1B[A',
  DOWN: '\x1B[B',
  RIGHT: '\x1B[C',
  LEFT: '\x1B[D',
  ENTER: '\r',
  SPACE: ' ',
  TAB: '\t',
  ESC: '\x1B',
  BACKSPACE: '\x7F',
  CTRL_C: '\x03',
  CTRL_D: '\x04',
};
