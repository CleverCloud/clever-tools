import { input, password } from '@inquirer/prompts';

export function promptEmail (message) {
  return input({
    message,
    validate: (value) => {
      if (value.match(/^.+@.+\..+$/)) {
        return true;
      }
      return 'Please enter a valid email address';
    },
  }).catch((error) => {
    if (error instanceof Error && error.name === 'ExitPromptError') {
      process.exit(1);
    }
    throw error;
  });
}

export function promptPassword (message) {
  return password({ message, mask: true }).catch((error) => {
    if (error instanceof Error && error.name === 'ExitPromptError') {
      process.exit(1);
    }
    throw error;
  });
}
