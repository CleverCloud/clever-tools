import { confirm as confirmPrompt, input, password, select } from '@inquirer/prompts';

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

export function isNotEmpty(value) {
  return value.trim().length > 0 || 'This field is required';
}

export function isValidUrl(value) {
  try {
    new URL(value);
    return true;
  } catch {
    return 'Please enter a valid URL (e.g. https://example.com)';
  }
}

export async function promptField(message, value, defaultValue, validate) {
  if (value != null) {
    if (validate != null) {
      const result = validate(value);
      if (result !== true) throw new Error(result);
    }
    return value;
  }
  return input({ message, default: defaultValue, validate }).catch(exitOnPromptError);
}

export function exitOnPromptError(error) {
  if (error instanceof Error && error.name === 'ExitPromptError') {
    process.exit(1);
  }
  throw error;
}
