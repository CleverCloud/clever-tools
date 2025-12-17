/**
 * @typedef {Object} ZodSchemaLike
 * @property {{ type?: string, innerType?: ZodSchemaLike, defaultValue?: unknown, typeName?: string }} [_def]
 */

/**
 * Checks if a Zod schema is a boolean.
 * Handles wrapped schemas (default, optional, nullable).
 * @param {ZodSchemaLike} schema
 * @return {boolean}
 */
export function isBoolean(schema) {
  const schemaType = schema._def?.type;
  if (schemaType === 'boolean') return true;
  if (schemaType === 'default' || schemaType === 'optional' || schemaType === 'nullable') {
    const innerType = schema._def?.innerType;
    if (innerType) return isBoolean(innerType);
  }
  return false;
}

/**
 * Checks if a Zod schema is required (no default, not optional, not nullable).
 * @param {ZodSchemaLike} schema
 * @return {boolean}
 */
export function isRequired(schema) {
  const schemaType = schema._def?.type;
  return schemaType !== 'default' && schemaType !== 'optional' && schemaType !== 'nullable';
}

/**
 * Extracts the default value from a Zod schema.
 * Handles wrapped schemas (optional, nullable).
 * @param {ZodSchemaLike} schema
 * @return {unknown}
 */
export function getDefault(schema) {
  /** @type {ZodSchemaLike | undefined} */
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
