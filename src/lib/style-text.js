import { styleText as nativeStyleText } from 'node:util';
import { hasParam } from './has-param.js';

export const VALID_FORCE_COLOR_VALUES = ['', '1', '2', '3', 'true'];

export const IS_COLOR_DISABLED = getColorDisabled();

function getColorDisabled() {
  if (hasParam('--no-color') || hasParam('--color', 'false')) {
    return true;
  }
  if (hasParam('--color', 'true')) {
    return false;
  }
  if (process.env.FORCE_COLOR != null) {
    return !VALID_FORCE_COLOR_VALUES.includes(process.env.FORCE_COLOR);
  }
  if (!process.stdout.isTTY) {
    return true;
  }
  if (process.env.NO_COLOR) {
    return true;
  }
  return process.env.TERM === 'dumb';
}

/**
 * @param {Parameters<typeof nativeStyleText>[0]} format
 * @param {any} value
 */
export function styleText(format, value) {
  const valueAsString = typeof value === 'number' || typeof value === 'boolean' ? String(value) : value;
  if (typeof valueAsString !== 'string') {
    return '';
  }
  if (IS_COLOR_DISABLED) {
    return valueAsString;
  }
  return nativeStyleText(format, valueAsString, { validateStream: false });
}
