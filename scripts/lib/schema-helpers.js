/**
 * @typedef {import('zod').ZodType} ZodType
 */

/**
 * Checks if a Zod schema is required (no default, not optional, not nullable).
 * @param {ZodType} schema
 * @return {boolean}
 */
export function isRequired(schema) {
  const schemaType = schema._def?.type;
  return schemaType !== 'default' && schemaType !== 'optional' && schemaType !== 'nullable';
}

/**
 * Checks if a Zod schema is a boolean.
 * @param {ZodType} schema
 * @return {boolean}
 */
export function isBoolean(schema) {
  const schemaType = schema._def?.type;
  if (schemaType === 'boolean') return true;
  // Handle wrappers (default, optional, nullable)
  if (schemaType === 'default' || schemaType === 'optional' || schemaType === 'nullable') {
    const innerType = schema._def?.innerType;
    if (innerType) return isBoolean(innerType);
  }
  return false;
}

/**
 * Extracts the default value from a Zod schema.
 * @param {ZodType} schema
 * @return {*}
 */
export function getDefault(schema) {
  let current = schema;
  while (current) {
    const schemaType = current._def?.type;
    if (schemaType === 'default') {
      return current._def?.defaultValue;
    }
    if (schemaType === 'optional' || schemaType === 'nullable') {
      current = current._def?.innerType;
      continue;
    }
    break;
  }
  return undefined;
}
