import { password } from '@inquirer/prompts';

export function promptPassword (message) {
  return password({ message, mask: true }).catch((error) => {
    if (error instanceof Error && error.name === 'ExitPromptError') {
      process.exit(1);
    }
    throw error;
  });
}
