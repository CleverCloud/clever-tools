/**
 * Define a CLI argument with full type inference from Zod schema.
 *
 * This is an identity function that provides type safety and IDE support.
 * The actual parsing and conversion to framework format (e.g., cliparse)
 * happens in the CLI adapter layer.
 *
 * Arguments represent positional command-line values:
 *   clever command <arg1> <arg2> --flag value
 *
 * @type {import('./define-argument.types.js').defineArgument}
 *
 * @example
 * // Define a reusable argument
 * export const addonIdArg = defineArgument({
 *   // parser: addonIdOrName
 *   schema: z.string(),
 *   description: 'Add-on ID (or name, if unambiguous)',
 *   placeholder: 'addon-id',
 *   complete: listAvailableAddons,
 * });
 *
 * @example
 * // Optional argument
 * const appNameArg = defineArgument({
 *   schema: z.string().optional(),
 *   description: 'Application name (optional)',
 *   placeholder: 'app-name',
 * });
 *
 * @example
 * // Use inline in defineCommand
 * defineCommand({
 *   name: 'create',
 *   description: 'Create an application',
 *   args: [
 *     defineArgument({
 *       schema: z.string().optional(),
 *       description: 'Application name',
 *       placeholder: 'app-name',
 *     }),
 *   ],
 *   async handler(flags, appName) {
 *     // appName is string | undefined
 *   },
 * });
 */
export function defineArgument(argumentDefinition) {
  return argumentDefinition;
}
