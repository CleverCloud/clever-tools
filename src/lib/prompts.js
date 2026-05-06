import { checkbox, confirm as confirmPrompt, input, password, select } from '@inquirer/prompts';
import { exit } from './exit.js';
import { unwrapSchema } from './zod-utils.js';

export function promptSecret(message) {
  return password({ message, mask: true }).catch(exitOnPromptError);
}

export async function confirm(message, rejectionMessage, defaultAnswer = true) {
  const answer = await confirmPrompt({ message, default: defaultAnswer }).catch(exitOnPromptError);
  if (!answer) {
    throw new Error(rejectionMessage);
  }

  return answer;
}

export async function ask(message, defaultAnswer = true) {
  return confirmPrompt({ message, default: defaultAnswer }).catch(exitOnPromptError);
}

export async function confirmAnswer(message, rejectionMessage, expectedAnswer) {
  const answer = await input({ message }).catch(exitOnPromptError);
  if (answer !== expectedAnswer) {
    throw new Error(rejectionMessage);
  }
}

export function selectAnswer(message, choices) {
  return select({ message, choices }).catch(exitOnPromptError);
}

export function promptCheckbox(message, choices) {
  return checkbox({ message, choices }).catch(exitOnPromptError);
}

/**
 * Prompt the user for a text value based on an option definition.
 * Derives the prompt message from option.description and validation from option.schema.
 * @param {import('./define-option.types.js').OptionDefinition} option
 * @param {string} [defaultValue]
 * @returns {Promise<string>}
 */
export function promptTextOption(option, defaultValue) {
  const message = `${option.description}:`;
  const innerSchema = unwrapSchema(option.schema);
  const validate = (value) => {
    const result = innerSchema.safeParse(value);
    return result.success || result.error.issues[0]?.message || 'Invalid value';
  };
  return input({ message, default: defaultValue, validate }).catch(exitOnPromptError);
}

async function exitOnPromptError(error) {
  if (error instanceof Error && error.name === 'ExitPromptError') {
    await exit(1);
  }
  throw error;
}
