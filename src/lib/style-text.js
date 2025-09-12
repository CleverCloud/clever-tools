import { styleText as nativeStyleText } from 'node:util';

/**
 * @param {Parameters<typeof nativeStyleText>[0]} format
 * @param {any} value
 */
export function styleText(format, value) {
  if (typeof value === 'string') {
    return nativeStyleText(format, value);
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return nativeStyleText(format, String(value));
  }
  return '';
}
