/**
 * Define a CLI flag with full type inference from Zod schema.
 *
 * This is an identity function that provides type safety and IDE support.
 * The actual parsing and conversion to framework format (e.g., cliparse)
 * happens in the CLI adapter layer.
 *
 * Flags represent command-line options that can be:
 * - Boolean switches (--verbose, --no-color)
 * - Value options (--region=par, --format json)
 *
 * @type {import('./define-flag.types.js').defineFlag}
 *
 * @example
 * // Define a reusable flag
 * export const regionFlag = defineFlag({
 *   schema: z.string().default('par'),
 *   description: 'Target region',
 *   aliases: ['r'],
 *   placeholder: 'ZONE',
 *   complete: () => ['par', 'rbx', 'mtl'],
 * });
 *
 * @example
 * // Boolean flag
 * const verboseFlag = defineFlag({
 *   schema: z.boolean().default(false),
 *   description: 'Enable verbose output',
 *   aliases: ['v'],
 * });
 *
 * @example
 * // Deprecated flag with migration message
 * const legacyFlag = defineFlag({
 *   schema: z.string().optional(),
 *   description: 'Legacy option',
 *   deprecated: 'Use --new-option instead',
 * });
 */
export function defineFlag(flagDefinition) {
  return flagDefinition;
}
