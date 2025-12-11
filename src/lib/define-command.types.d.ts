import { z } from 'zod';

import { ArgumentDefinition, InferArgsType } from './define-argument.types.js';
import { OptionDefinition } from './define-option.types.js';

/**
 * A record of option definitions keyed by option name.
 */
export type OptionsRecord = Record<string, OptionDefinition>;

/**
 * Extract the inferred type from an OptionDefinition's schema.
 */
type InferOptionSchema<O extends OptionDefinition> = O['schema'] extends z.ZodType<infer U> ? U : unknown;

/**
 * Infer the options object type from an OptionsRecord.
 * Maps each option name to its schema's inferred type.
 */
type InferOptionsType<O extends OptionsRecord> = {
  [K in keyof O]: InferOptionSchema<O[K]>;
};

/**
 * Command definition shape with full type inference.
 *
 * @template O - Options record (Record<string, OptionDefinition> or undefined)
 * @template A - Args array (readonly ArgumentDefinition[] or undefined)
 */
export interface CommandDefinition<
  O extends OptionsRecord | undefined = undefined,
  A extends readonly ArgumentDefinition[] | undefined = undefined,
> {
  /**
   * Short description for help text.
   *
   * @example 'Create a new application'
   */
  description: string;

  /**
   * Usage examples as plain strings.
   * Shown in help output.
   *
   * @example ['clever create --type node my-app', 'clever create --type static']
   */
  examples?: string[];

  /**
   * Mark command as experimental.
   * Experimental commands may show a warning when used.
   */
  isExperimental?: boolean;

  /**
   * Feature flag name that must be enabled for this command to be available.
   * If the feature flag is not enabled, the command will be hidden.
   */
  featureFlag?: string;

  /**
   * Version when this command was introduced (semver format).
   *
   * @example '2.1.0'
   */
  since?: `${number}.${number}.${number}`;

  /**
   * Date when this command was introduced (ISO format YYYY-MM-DD).
   *
   * @example '2020-03-20'
   */
  sinceDate?: `${number}-${number}-${number}`;

  /**
   * Options (named options like --type, --region, --format).
   * Defined as a record of OptionDefinition objects.
   *
   * @example
   * options: {
   *   type: defineOption({ schema: z.string(), description: 'App type' }),
   *   region: defineOption({ schema: z.string().default('par'), description: 'Region' }),
   * }
   */
  options?: O;

  /**
   * Positional arguments as array of ArgumentDefinition.
   * Arguments are passed to the handler as individual parameters in order.
   *
   * @example
   * args: [
   *   defineArgument({ schema: z.string(), description: 'Add-on ID', placeholder: 'addon-id' }),
   *   defineArgument({ schema: z.string().optional(), description: 'New name', placeholder: 'name' }),
   * ]
   */
  args?: A;

  /**
   * Command handler function.
   * Receives parsed options as first argument, then args as positional parameters.
   * Can be null for root commands that only serve as parents for subcommands.
   *
   * @example
   * async handler(options, addonId, newName) {
   *   // options is { type: string, region: string }
   *   // addonId is string
   *   // newName is string | undefined
   * }
   */
  handler:
    | null
    | (A extends readonly ArgumentDefinition[]
        ? (
            options: O extends OptionsRecord ? InferOptionsType<O> : Record<string, never>,
            ...args: InferArgsType<A>
          ) => Promise<void>
        : (options: O extends OptionsRecord ? InferOptionsType<O> : Record<string, never>) => Promise<void>);
}

/**
 * Define a CLI command with full type inference from option and argument definitions.
 *
 * @example
 * const createCommand = defineCommand({
 *   description: 'Create a new application',
 *   options: {
 *     type: defineOption({ schema: z.string(), description: 'App type', aliases: ['t'] }),
 *     region: defineOption({ schema: z.string().default('par'), description: 'Region', aliases: ['r'] }),
 *   },
 *   args: [
 *     defineArgument({ schema: z.string().optional(), description: 'App name', placeholder: 'app-name' }),
 *   ],
 *   async handler(options, appName) {
 *     // options is { type: string, region: string }
 *     // appName is string | undefined
 *   },
 * });
 *
 * @example
 * // Command with multiple arguments
 * const renameCommand = defineCommand({
 *   description: 'Rename an add-on',
 *   args: [
 *     addonIdArg,  // reusable argument
 *     defineArgument({ schema: z.string(), description: 'New name', placeholder: 'new-name' }),
 *   ],
 *   async handler(options, addonId, newName) {
 *     // addonId is string, newName is string
 *   },
 * });
 */
export function defineCommand<
  O extends OptionsRecord | undefined = undefined,
  const A extends readonly ArgumentDefinition[] | undefined = undefined,
>(definition: CommandDefinition<O, A>): CommandDefinition<O, A>;
