import xterm from '@xterm/headless';

const { Terminal } = xterm;

/** Width of the screen, at least the `CLI_WIDTH` of the sandbox, so that the prompts are laid out the same. */
const MIN_COLUMNS = 200;

/**
 * Render what a terminal shows once `raw` has been written to it: cursor moves and erased lines are replayed, so a
 * prompt redrawn on each typed character ends up as its final line. Trailing spaces and trailing empty lines are
 * dropped. The screen is wider than the longest line, so no line wraps.
 * @param raw - Output of a command, escape sequences included
 * @returns The lines of the screen, joined by `\n`
 */
export async function renderTerminalScreen(raw: string): Promise<string> {
  const lines = raw.split('\n');
  const terminal = new Terminal({
    cols: Math.max(MIN_COLUMNS, ...lines.map((line) => line.length)),
    // One row per line: nothing scrolls out of the screen.
    rows: lines.length,
    scrollback: 0,
    // A lone `\n` (piped output) moves to the start of the next line, like the `\r\n` of a terminal.
    convertEol: true,
    allowProposedApi: true,
  });
  try {
    await new Promise<void>((resolve) => terminal.write(raw, resolve));
    const buffer = terminal.buffer.active;
    const screen: Array<string> = [];
    for (let index = 0; index < buffer.length; index++) {
      screen.push(buffer.getLine(index)?.translateToString(true).trimEnd() ?? '');
    }
    while (screen.length > 0 && screen.at(-1) === '') {
      screen.pop();
    }
    return screen.join('\n');
  } finally {
    terminal.dispose();
  }
}
