import { checkbox, confirm as confirmPrompt, input, password, select } from '@inquirer/prompts';
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

/**
 * @param {string} message
 * @param {Array<unknown>} choices
 * @param {string} [nonInteractiveHint] How to achieve the same result without a prompt (e.g. an option to use)
 */
export function selectAnswer(message, choices, nonInteractiveHint) {
  assertInteractiveTerminal(nonInteractiveHint);
  return select({ message, choices }).catch(exitOnPromptError);
}

/**
 * @param {string} message
 * @param {Array<unknown>} choices
 * @param {string} [nonInteractiveHint] How to achieve the same result without a prompt (e.g. an option to use)
 */
export function promptCheckbox(message, choices, nonInteractiveHint) {
  assertInteractiveTerminal(nonInteractiveHint);
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

/**
 * Throw an explicit error when no interactive terminal is available.
 *
 * Raw-mode prompts (select, checkbox) need a TTY on stdin. Without one (CI, scripts,
 * pipes, `< /dev/null`), Inquirer reads EOF and throws ExitPromptError, which
 * exitOnPromptError turns into a silent `process.exit(1)` — indistinguishable from a
 * user pressing Ctrl+C. Guarding up front lets us surface a clear message instead.
 * @param {string} [hint] How to achieve the same result without a prompt (e.g. an option to use)
 */
function assertInteractiveTerminal(hint) {
  if (!process.stdin.isTTY) {
    const suffix = hint != null ? ` ${hint}` : '';
    throw new Error(`This command requires an interactive terminal.${suffix}`);
  }
}

function exitOnPromptError(error) {
  if (error instanceof Error && error.name === 'ExitPromptError') {
    process.exit(1);
  }
  throw error;
}
