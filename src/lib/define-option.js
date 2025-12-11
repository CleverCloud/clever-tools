/**
 * Define a CLI option with full type inference from Zod schema.
 *
 * This is an identity function that provides type safety and IDE support.
 * The actual parsing and conversion to framework format (e.g., cliparse)
 * happens in the CLI adapter layer.
 *
 * Options represent command-line options that can be:
 * - Boolean switches (--verbose, --no-color)
 * - Value options (--region=par, --format json)
 *
 * @type {import('./define-option.types.js').defineOption}
 *
 * @example
 * // Define a reusable option
 * export const regionOption = defineOption({
 *   schema: z.string().default('par'),
 *   description: 'Target region',
 *   aliases: ['r'],
 *   placeholder: 'ZONE',
 *   complete: () => ['par', 'rbx', 'mtl'],
 * });
 *
 * @example
 * // Boolean option
 * const verboseOption = defineOption({
 *   schema: z.boolean().default(false),
 *   description: 'Enable verbose output',
 *   aliases: ['v'],
 * });
 *
 * @example
 * // Deprecated option with migration message
 * const legacyOption = defineOption({
 *   schema: z.string().optional(),
 *   description: 'Legacy option',
 *   deprecated: 'Use --new-option instead',
 * });
 */
export function defineOption(optionDefinition) {
  return optionDefinition;
}
