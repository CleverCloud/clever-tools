import { z } from 'zod';
import { CompletionFunction } from './define-common.types.js';

/** Define a CLI option with full type inference from Zod schema. */
export function defineOption<S extends z.ZodType>(definition: OptionDefinition<S>): OptionDefinition<S>;

/** Option definition shape with Zod schema for type inference. */
export interface OptionDefinition<S extends z.ZodType = z.ZodType> {
  /** The CLI option name (e.g., 'region' for --region). */
  name: string;

  /** Zod schema defining the option's type, default value, and validation. */
  schema: S;

  /** Human-readable description for help text. */
  description: string;

  /** Alternative names for this option (e.g., ['v'] for -v). */
  aliases?: string[];

  /** Placeholder text shown in help (e.g., 'ZONE' for --region <ZONE>). */
  placeholder?: string;

  /** Shell completion function. Can be sync or async. */
  complete?: CompletionFunction;

  /**
   * Groups this option belongs to (e.g., ['splunk'] for an option only meaningful for that drain type).
   * Help and docs list each group separately, so an option that applies to several groups declares
   * them all and shows up under each. Omit for options that apply to every use of the command.
   */
  groups?: string[];

  /** Mark as deprecated. `true` for generic warning, or a string with migration instructions. */
  deprecated?: boolean | string;
}
