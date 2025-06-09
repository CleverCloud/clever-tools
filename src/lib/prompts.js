import { confirm as confirmPrompt, input, password, select } from '@inquirer/prompts';

export function promptSecret (message) {
  return password({ message, mask: true }).catch(exitOnPromptError);
}

export async function confirm (message, rejectionMessage) {
  const answer = await confirmPrompt({ message }).catch(exitOnPromptError);
  if (!answer) {
    throw new Error(rejectionMessage);
  }
}

export async function confirmAnswer (message, rejectionMessage, expectedAnswer) {
  const answer = await input({ message }).catch(exitOnPromptError);
  if (answer !== expectedAnswer) {
    throw new Error(rejectionMessage);
  }
}

export function selectAnswer (message, choices) {
  return select({ message, choices }).catch(exitOnPromptError);
}

function exitOnPromptError (error) {
  if (error instanceof Error && error.name === 'ExitPromptError') {
    process.exit(1);
  }
  throw error;
}
