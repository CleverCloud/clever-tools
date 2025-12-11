import { z } from 'zod';

/**
 * Completion context provided to completion functions.
 * Contains partial command state for intelligent completion.
 */
export interface CompletionContext {
  /** The current partial input being completed */
  current?: string;
  /** Previously parsed option values */
  options?: Record<string, unknown>;
  /** Previously parsed argument values */
  args?: unknown[];
}

/**
 * Completion function signature for shell autocompletion.
 * Can be sync or async for API-based completions.
 */
export type CompletionFunction = (context?: CompletionContext) => string[] | Promise<string[]>;

/**
 * Option definition shape with Zod schema for type inference.
 *
 * Options represent command-line options that can be:
 * - Boolean switches (--verbose, --no-color)
 * - Value options (--region=par, --format json)
 *
 * The type is inferred from the Zod schema.
 *
 * @template S - Zod schema type
 *
 * @example
 * // Boolean option
 * defineOption({
 *   name: 'verbose',
 *   schema: z.boolean().default(false),
 *   description: 'Enable verbose output',
 *   aliases: ['v'],
 * });
 *
 * @example
 * // String option with default
 * defineOption({
 *   name: 'region',
 *   schema: z.string().default('par'),
 *   description: 'Target region',
 *   aliases: ['r'],
 *   placeholder: 'ZONE',
 * });
 *
 * @example
 * // Required enum option
 * defineOption({
 *   name: 'format',
 *   schema: z.enum(['human', 'json']),
 *   description: 'Output format',
 *   aliases: ['F'],
 *   placeholder: 'FORMAT',
 * });
 */
export interface OptionDefinition<S extends z.ZodType = z.ZodType> {
  /**
   * The CLI option name used by the parser (e.g., 'region' for --region).
   *
   * This is the name shown to users in help text and used on the command line.
   * The object key in the command's options record is only for internal code access.
   *
   * @example 'region' // --region
   * @example 'dry-run' // --dry-run
   */
  name: string;

  /**
   * Zod schema defining the option's type, default value, and validation.
   *
   * The schema determines:
   * - Type (string, boolean, number, enum, etc.)
   * - Whether the option is required (no default) or optional (has default)
   * - Default value (via .default())
   * - Validation rules (via .refine(), .transform(), etc.)
   *
   * @example z.string() // required string
   * @example z.string().default('par') // optional string with default
   * @example z.boolean().default(false) // boolean option
   * @example z.enum(['human', 'json']) // enum option
   * @example z.number().int().positive() // validated number
   */
  schema: S;

  /**
   * Human-readable description for help text.
   * Should be concise but descriptive.
   *
   * Convention: Start with capital letter, no trailing period.
   *
   * @example 'Target region for deployment'
   * @example 'Output format (human, json)'
   */
  description: string;

  /**
   * Alternative names for this option.
   * Can include both short (-v) and long (--verbose) aliases.
   *
   * All aliases are treated equally - order doesn't matter.
   * The primary name comes from the object key in defineCommand.
   *
   * @example ['v'] // -v alias for --verbose
   * @example ['since'] // --since alias for --after
   * @example ['F', 'fmt'] // multiple aliases
   */
  aliases?: string[];

  /**
   * Placeholder text shown in help documentation.
   * Indicates the expected value format.
   *
   * Shown as: --option <PLACEHOLDER>
   *
   * @example 'ZONE' // --region <ZONE>
   * @example 'FORMAT' // --format <FORMAT>
   * @example 'OWNER/REPO' // --github <OWNER/REPO>
   */
  placeholder?: string;

  /**
   * Mark this option as deprecated.
   *
   * - `true`: Shows generic deprecation warning
   * - `string`: Shows custom message (e.g., migration instructions)
   *
   * Deprecated options still work but show warnings when used.
   *
   * @example true
   * @example 'Use --region instead'
   */
  deprecated?: boolean | string;

  /**
   * Shell completion function.
   * Provides dynamic completion suggestions.
   *
   * Can be synchronous or asynchronous for API-based completions.
   *
   * @example () => ['par', 'rbx', 'mtl'] // static completions
   * @example async () => await fetchRegions() // dynamic completions
   */
  complete?: CompletionFunction;
}

/**
 * Infer the output type from a Zod schema.
 */
export type InferOptionType<S extends z.ZodType> = z.infer<S>;

/**
 * Define a CLI option with full type inference from Zod schema.
 *
 * This is an identity function that provides type safety and IDE support.
 * The actual parsing and conversion to framework format (e.g., cliparse)
 * happens in the CLI adapter layer.
 *
 * @template S - Zod schema type for type inference
 * @param definition - Option definition object
 * @returns The same definition with proper typing
 *
 * @example
 * // Define a reusable option
 * export const regionOption = defineOption({
 *   name: 'region',
 *   schema: z.string().default('par'),
 *   description: 'Target region',
 *   aliases: ['r'],
 *   placeholder: 'ZONE',
 *   complete: () => ['par', 'rbx', 'mtl', 'scw', 'sgp', 'syd'],
 * });
 *
 * @example
 * // Use inline in defineCommand
 * defineCommand({
 *   name: 'deploy',
 *   description: 'Deploy application',
 *   options: {
 *     region: defineOption({
 *       name: 'region',
 *       schema: z.string().default('par'),
 *       description: 'Target region',
 *     }),
 *     verbose: defineOption({
 *       name: 'verbose',
 *       schema: z.boolean().default(false),
 *       description: 'Enable verbose output',
 *       aliases: ['v'],
 *     }),
 *   },
 *   handler: async (options) => {
 *     // options.region is string, options.verbose is boolean
 *   },
 * });
 */
export function defineOption<S extends z.ZodType>(definition: OptionDefinition<S>): OptionDefinition<S>;
