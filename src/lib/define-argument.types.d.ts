import { z } from 'zod';

import { CompletionContext, CompletionFunction } from './define-flag.types.js';

// Re-export for convenience
export { CompletionContext, CompletionFunction };

/**
 * Argument definition shape with Zod schema for type inference.
 *
 * Arguments represent positional command-line values that appear after
 * the command name, before any flags:
 *   clever command <arg1> <arg2> --flag value
 *
 * The type is inferred from the Zod schema.
 *
 * @template S - Zod schema type
 *
 * @example
 * // Required string argument
 * defineArgument({
 *   schema: z.string(),
 *   description: 'Add-on ID (or name, if unambiguous)',
 *   placeholder: 'addon-id',
 * });
 *
 * @example
 * // Optional argument with default
 * defineArgument({
 *   schema: z.string().optional(),
 *   description: 'Application name (optional, current directory name is used if not specified)',
 *   placeholder: 'app-name',
 * });
 *
 * @example
 * // Argument with completion
 * defineArgument({
 *   schema: z.string(),
 *   description: 'Drain type',
 *   placeholder: 'drain-type',
 *   complete: () => ['http', 'tcp', 'udp'],
 * });
 */
export interface ArgumentDefinition<S extends z.ZodType = z.ZodType> {
  /**
   * Zod schema defining the argument's type, default value, and validation.
   *
   * The schema determines:
   * - Type (string, number, etc.)
   * - Whether the argument is required (no default/optional) or optional
   * - Default value (via .default())
   * - Validation rules (via .refine(), .transform(), etc.)
   *
   * For custom parsers (e.g., addonIdOrName), use z.string() and add
   * a comment above with the parser name for documentation.
   *
   * @example z.string() // required string
   * @example z.string().optional() // optional string
   * @example z.string().default('default-value') // string with default
   * @example z.number().int().positive() // validated number
   */
  schema: S;

  /**
   * Human-readable description for help text.
   * Should be concise but descriptive.
   *
   * Convention: Start with capital letter, no trailing period.
   *
   * @example 'Add-on ID (or name, if unambiguous)'
   * @example 'Application name'
   */
  description: string;

  /**
   * Placeholder text shown in help documentation.
   * Indicates what kind of value is expected.
   *
   * Shown as: command <PLACEHOLDER> or command <placeholder>
   * Can be uppercase (ADDON_ID) or kebab-case (addon-id).
   *
   * @example 'addon-id'
   * @example 'ADDON_ID'
   * @example 'app-name'
   */
  placeholder: string;

  /**
   * Mark this argument as deprecated.
   *
   * - `true`: Shows generic deprecation warning
   * - `string`: Shows custom message (e.g., migration instructions)
   *
   * Deprecated arguments still work but show warnings when used.
   *
   * @example true
   * @example 'Use the --addon flag instead'
   */
  deprecated?: boolean | string;

  /**
   * Shell completion function.
   * Provides dynamic completion suggestions.
   *
   * Can be synchronous or asynchronous for API-based completions.
   *
   * @example () => ['http', 'tcp', 'udp'] // static completions
   * @example async () => await fetchAddonIds() // dynamic completions
   */
  complete?: CompletionFunction;
}

/**
 * Infer the output type from an ArgumentDefinition's schema.
 */
export type InferArgumentType<S extends z.ZodType> = z.infer<S>;

/**
 * Extract the inferred type from an ArgumentDefinition's schema.
 */
type InferArgumentSchema<A extends ArgumentDefinition> = A['schema'] extends z.ZodType<infer U> ? U : unknown;

/**
 * Infer types from an array of ArgumentDefinitions.
 * Returns a tuple type for use as positional parameters.
 *
 * @example
 * type Args = InferArgsType<[ArgumentDefinition<z.ZodString>, ArgumentDefinition<z.ZodOptional<z.ZodString>>]>;
 * // Result: [string, string | undefined]
 */
export type InferArgsType<A extends readonly ArgumentDefinition[]> = {
  [K in keyof A]: A[K] extends ArgumentDefinition ? InferArgumentSchema<A[K]> : never;
};

/**
 * Define a CLI argument with full type inference from Zod schema.
 *
 * This is an identity function that provides type safety and IDE support.
 * The actual parsing and conversion to framework format (e.g., cliparse)
 * happens in the CLI adapter layer.
 *
 * @template S - Zod schema type for type inference
 * @param definition - Argument definition object
 * @returns The same definition with proper typing
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
export function defineArgument<S extends z.ZodType>(definition: ArgumentDefinition<S>): ArgumentDefinition<S>;
