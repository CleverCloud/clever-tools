import colors from 'colors/safe.js';

const LOGO = colors.green(`
 ██████╗██╗     ███████╗██╗   ██╗███████╗██████╗     ██╗  ██╗ █████╗ ███████╗
██╔════╝██║     ██╔════╝██║   ██║██╔════╝██╔══██╗    ██║ ██╔╝██╔══██╗██╔════╝
██║     ██║     █████╗  ██║   ██║█████╗  ██████╔╝    █████╔╝ ╚█████╔╝███████╗
██║     ██║     ██╔══╝  ╚██╗ ██╔╝██╔══╝  ██╔══██╗    ██╔═██╗ ██╔══██╗╚════██║
╚██████╗███████╗███████╗ ╚████╔╝ ███████╗██║  ██║    ██║  ██╗╚█████╔╝███████║
 ╚═════╝╚══════╝╚══════╝  ╚═══╝  ╚══════╝╚═╝  ╚═╝    ╚═╝  ╚═╝ ╚════╝ ╚══════╝

 Your Clever Cloud Kubernetes cluster has been successfully created, here is how to manage it:

 *** REDACTED ***
`);

// const clearScreen = () => process.stdout.write('\x1B[2J\x1B[0f');
const hideCursor = () => process.stdout.write('\x1B[?25l');
const showCursor = () => process.stdout.write('\x1B[?25h');
const sleep = (ms = 10) => new Promise((resolve) => setTimeout(resolve, ms));

export async function typewriterLogo () {
  hideCursor();

  const lines = LOGO.split('\n');

  for (const line of lines) {
    for (const char of line) {
      process.stdout.write(char);
      await sleep();
    }
    console.log();
  }

  showCursor();
}
