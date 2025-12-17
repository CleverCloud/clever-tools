/**
 * @typedef {Object} ZodSchemaLike
 * @property {{ type?: string, innerType?: ZodSchemaLike, defaultValue?: unknown, typeName?: string, in?: ZodSchemaLike }} [_def]
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
  if (schemaType === 'default' || schemaType === 'optional' || schemaType === 'nullable') {
    return false;
  }
  // For pipe schemas (created by .transform()), check the input schema
  if (schemaType === 'pipe') {
    const inputSchema = schema._def?.in;
    if (inputSchema) return isRequired(inputSchema);
  }
  return true;
}

/**
 * Extracts the default value from a Zod schema.
 * Handles wrapped schemas (optional, nullable, pipe).
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
    // For pipe schemas (created by .transform()), check the input schema
    if (schemaType === 'pipe') {
      current = current._def?.in;
      continue;
    }
    break;
  }
  return undefined;
}
