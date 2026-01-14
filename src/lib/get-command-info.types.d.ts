export interface ZodSchemaLike {
  _def?: {
    type?: string;
    innerType?: ZodSchemaLike;
    defaultValue?: unknown;
  };
}

export interface ArgumentInfo {
  /** The argument placeholder name */
  name: string;
  /** The argument description */
  description: string;
  /** '(optional)' or null */
  optional: string | null;
}

export interface OptionInfo {
  /** The option name (without dashes) */
  name: string;
  /** Aliases with dashes (short first, then name, then other long aliases) */
  aliases: string[];
  /** The option description */
  description: string;
  /** Placeholder, or null for booleans */
  placeholder: string | null;
  /** '(deprecated)', '(deprecated, with message)' or null */
  deprecated: string | null;
  /** '(required)' or null */
  required: string | null;
  /** '(default: value)' or null */
  default: string | null;
}

export interface CommandInfo {
  /** The usage line string */
  usage: string;
  /** Sorted by position, or null if no arguments */
  args: ArgumentInfo[] | null;
  /** Sorted by required first, then alphabetically, or null if no options */
  options: OptionInfo[] | null;
}
