import { z } from 'zod';

import { ArgumentDefinition, InferArgsType } from './define-argument.types.js';
import { FlagDefinition } from './define-flag.types.js';

/**
 * A record of flag definitions keyed by flag name.
 */
export type FlagsRecord = Record<string, FlagDefinition>;

/**
 * Extract the inferred type from a FlagDefinition's schema.
 */
type InferFlagSchema<F extends FlagDefinition> = F['schema'] extends z.ZodType<infer U> ? U : unknown;

/**
 * Infer the flags object type from a FlagsRecord.
 * Maps each flag name to its schema's inferred type.
 */
type InferFlagsType<F extends FlagsRecord> = {
  [K in keyof F]: InferFlagSchema<F[K]>;
};

/**
 * Command definition shape with full type inference.
 *
 * @template F - Flags record (Record<string, FlagDefinition> or undefined)
 * @template A - Args array (readonly ArgumentDefinition[] or undefined)
 */
export interface CommandDefinition<
  F extends FlagsRecord | undefined = undefined,
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
   * Flags (named options like --type, --region, --format).
   * Defined as a record of FlagDefinition objects.
   *
   * @example
   * flags: {
   *   type: defineFlag({ schema: z.string(), description: 'App type' }),
   *   region: defineFlag({ schema: z.string().default('par'), description: 'Region' }),
   * }
   */
  flags?: F;

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
   * Receives parsed flags as first argument, then args as positional parameters.
   * Can be null for root commands that only serve as parents for subcommands.
   *
   * @example
   * async handler(flags, addonId, newName) {
   *   // flags is { type: string, region: string }
   *   // addonId is string
   *   // newName is string | undefined
   * }
   */
  handler:
    | null
    | (A extends readonly ArgumentDefinition[]
        ? (
            flags: F extends FlagsRecord ? InferFlagsType<F> : Record<string, never>,
            ...args: InferArgsType<A>
          ) => Promise<void>
        : (flags: F extends FlagsRecord ? InferFlagsType<F> : Record<string, never>) => Promise<void>);
}

/**
 * Define a CLI command with full type inference from flag and argument definitions.
 *
 * @example
 * const createCommand = defineCommand({
 *   description: 'Create a new application',
 *   flags: {
 *     type: defineFlag({ schema: z.string(), description: 'App type', aliases: ['t'] }),
 *     region: defineFlag({ schema: z.string().default('par'), description: 'Region', aliases: ['r'] }),
 *   },
 *   args: [
 *     defineArgument({ schema: z.string().optional(), description: 'App name', placeholder: 'app-name' }),
 *   ],
 *   async handler(flags, appName) {
 *     // flags is { type: string, region: string }
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
 *   async handler(flags, addonId, newName) {
 *     // addonId is string, newName is string
 *   },
 * });
 */
export function defineCommand<
  F extends FlagsRecord | undefined = undefined,
  const A extends readonly ArgumentDefinition[] | undefined = undefined,
>(definition: CommandDefinition<F, A>): CommandDefinition<F, A>;
