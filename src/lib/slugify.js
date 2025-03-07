import slugifyRaw from 'slugify';

/**
 * Converts a string to a slug using strict mode
 * @param {string} string - The string to be converted to a slug
 * @returns {string} The slugified string
 */
export function slugify (string) {
  return slugifyRaw(string, { strict: true });
}
