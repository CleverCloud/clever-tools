import { z } from 'zod';
import { CompletionFunction } from './define-common.types.js';

/** Define a CLI argument with full type inference from Zod schema. */
export function defineArgument<S extends z.ZodType>(definition: ArgumentDefinition<S>): ArgumentDefinition<S>;

/** Argument definition shape with Zod schema for type inference. */
export interface ArgumentDefinition<S extends z.ZodType = z.ZodType> {
  /** Zod schema defining the argument's type, default value, and validation. */
  schema: S;

  /** Human-readable description for help text. */
  description: string;

  /** Placeholder text shown in help documentation (e.g., 'addon-id'). */
  placeholder: string;

  /** Shell completion function. Can be sync or async. */
  complete?: CompletionFunction;

  /** Mark as deprecated. `true` for generic warning, or a string with migration instructions. */
  deprecated?: boolean | string;
}
