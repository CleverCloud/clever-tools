import { z } from 'zod';

import { ArgumentDefinition } from './define-argument.types.js';
import { OptionDefinition } from './define-option.types.js';

/** Define a CLI command with full type inference from option and argument definitions. */
// The `const` modifier on `A` is critical: it tells TypeScript to infer the exact
// tuple type (e.g., `[StringArg, NumberArg]`) rather than widening to `ArgumentDefinition[]`.
// This preserves argument order and types for the handler signature.
export function defineCommand<O extends OptionsRecord | undefined, const A extends ArgumentsArray | undefined>(
  definition: CommandDefinition<O, A>,
): CommandDefinition<O, A>;

/**
 * Full specification for a CLI command.
 * @template O - Options record type, inferred from the `options` property.
 * @template A - Arguments tuple type, inferred from the `args` property.
 */
// Generic parameters allow TypeScript to infer exact types for options and arguments,
// which then flow into the handler signature for full type safety.
// Some commands don't have options, some don't have arguments, some don't have both.
export interface CommandDefinition<
  O extends OptionsRecord | undefined = OptionsRecord,
  A extends ArgumentsArray | undefined = ArgumentsArray,
> {
  /** Short description for help text. */
  description: string;

  /** Usage examples shown in help output. */
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

  /** Version when this command was introduced (semver format, e.g., '2.1.0'). */
  since?: `${number}.${number}.${number}`;

  /** Options (named options like --type, --region, --format). */
  options?: O;

  /** Positional arguments, passed to the handler as individual parameters in order. */
  args?: A;

  /** Command handler. Receives parsed options, then args. Null for parent-only commands. */
  handler: CommandHandler<O, A> | null;
}

// Dictionary of named options (e.g., { format: OptionDefinition, region: OptionDefinition }).
type OptionsRecord = Record<string, OptionDefinition>;

// Tuple of positional arguments.
// Must be `readonly` to preserve tuple structure and allow `const` inference.
type ArgumentsArray = readonly ArgumentDefinition[];

// Handler signature adapts based on whether args are defined.
// - With args: `(options, ...args) => Promise<void>` - args spread as individual parameters.
// - Without args: `(options) => Promise<void>` - no extra parameters.
type CommandHandler<O, A> = A extends ArgumentsArray
  ? (options: InferOptionsType<O>, ...args: InferArgsType<A>) => Promise<void>
  : (options: InferOptionsType<O>) => Promise<void>;

// Extracts runtime types from option definitions using Zod inference.
// Maps `{ foo: { schema: z.string() } }` → `{ foo: string }`.
type InferOptionsType<O> = O extends OptionsRecord
  ? { [K in keyof O]: z.infer<O[K]['schema']> }
  : Record<string, never>;

// Extracts runtime types from argument definitions as a tuple.
// Maps `[{ schema: z.string() }, { schema: z.number() }]` → `[string, number]`.
// Preserves tuple order so args are passed to handlers in the correct position.
// `keyof A` on an array includes both numeric indices ("0", "1", ...) and
// array properties ("length", "push", etc.). The `extends ArgumentDefinition`
// check returns `never` for non-index keys, effectively filtering them out.
type InferArgsType<A extends ArgumentsArray> = {
  [K in keyof A]: A[K] extends ArgumentDefinition ? z.infer<A[K]['schema']> : never;
};
