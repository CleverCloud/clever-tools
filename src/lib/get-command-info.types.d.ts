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
  /** Enum values if the schema is a z.enum(), or null */
  enumValues: string[] | null;
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
  /** Enum values if the schema is a z.enum(), or null */
  enumValues: string[] | null;
  /** Groups this option belongs to, or null when it applies to every use of the command */
  groups: string[] | null;
}

export interface OptionGroupInfo {
  /** The group name, or null for the options that apply to every use of the command */
  title: string | null;
  /** The options of this group, in the same order as `CommandInfo.options` */
  options: OptionInfo[];
}

export interface CommandInfo {
  /** The usage line string */
  usage: string;
  /** Sorted by position, or null if no arguments */
  args: ArgumentInfo[] | null;
  /** Sorted by required first, then alphabetically, or null if no options. Every option appears once. */
  options: OptionInfo[] | null;
  /**
   * The same options split for display: ungrouped ones first, then one entry per group, sorted by
   * title. An option declaring several groups is repeated in each of them, so a group reads as the
   * complete list of what applies to it. Null if no options.
   */
  optionGroups: OptionGroupInfo[] | null;
}
