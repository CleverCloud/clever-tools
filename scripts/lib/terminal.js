import { styleText } from 'node:util';

/**
 * Template literal tag function that highlights interpolated values in yellow.
 * Used for creating highlighted console output with template literals.
 * @param {TemplateStringsArray} strings - The string parts of the template literal
 * @param {...any} values - The interpolated values to highlight
 * @returns {string}
 */
export function highlight(strings, ...values) {
  let result = '';
  for (let i = 0; i < strings.length; i++) {
    result += strings[i];
    if (i < values.length) {
      result += styleText('yellow', String(values[i]));
    }
  }
  return result;
}
