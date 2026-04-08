import { checkbox, confirm as confirmPrompt, input, password, select } from '@inquirer/prompts';
import { unwrapSchema } from './zod-utils.js';

export function promptSecret(message) {
  return password({ message, mask: true }).catch(exitOnPromptError);
}

export async function confirm(message, rejectionMessage) {
  const answer = await confirmPrompt({ message }).catch(exitOnPromptError);
  if (!answer) {
    throw new Error(rejectionMessage);
  }

  return answer;
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

function exitOnPromptError(error) {
  if (error instanceof Error && error.name === 'ExitPromptError') {
    process.exit(1);
  }
  throw error;
}
