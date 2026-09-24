import { styleText } from './style-text.js';

/**
 * Builds the error thrown when a name matches several resources, listing them so the user can pick one by ID
 * @param {string} name - The name that matched several resources
 * @param {Array<{ name: string, id: string, details?: string }>} candidates - The resources matching the name, with optional details to tell them apart
 * @param {string} [idLabel] - How the identifier to use instead is called (e.g. "real ID", "key")
 * @returns {Error}
 */
export function ambiguousNameError(name, candidates, idLabel = 'ID') {
  const list = candidates
    .map((c) => `  - ${c.name} ${styleText('grey', `(${[c.id, c.details].filter(Boolean).join(', ')})`)}`)
    .join('\n');
  return new Error(`Ambiguous name ${styleText('red', name)}, use the ${idLabel} instead:\n${list}`);
}
