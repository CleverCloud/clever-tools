/**
 * CLI Framework Abstraction Layer
 *
 * This file defines framework-agnostic interfaces for describing CLI commands,
 * flags, and arguments. These interfaces can be mapped to any underlying
 * CLI framework (cliparse, oclif, Node.js parseArgs, etc.).
 *
 * Design principles:
 * - Use modern terminology from leading frameworks
 * - Provide flexibility without over-engineering
 * - Enable type-safe command definition
 * - Support both simple and complex CLI patterns
 */

// =============================================================================
// Core Value Types
// =============================================================================

/**
 * Primitive types that can be parsed from CLI input
 * Based on common types across all frameworks analyzed
 */
export type PrimitiveType = 'string' | 'boolean' | 'number' | 'integer';

/**
 * Extended types including collections and custom parsers
 * Inspired by oclif's type system and clap's flexibility
 */
export type FlagType = PrimitiveType | 'array' | 'custom';

/**
 * Result of a parsing operation
 * Pattern from optique and stricli for type-safe parsing
 */
export interface ParseResult<T = any> {
  success: boolean;
  value?: T;
  error?: string;
}

/**
 * Custom parser function signature
 * Influenced by cliparse's parser pattern and optique's functional approach
 */
export type Parser<T = any> = (input: string) => ParseResult<T>;

/**
 * Completion function for shell autocompletion
 * Pattern from oclif and cobra's completion systems
 */
export type CompletionFunction = (current?: string, context?: CompletionContext) => Promise<string[]> | string[];

/**
 * Context provided to completion functions
 * Includes partial command state for intelligent completion
 */
export interface CompletionContext {
  command: string;
  flags: Record<string, any>;
  args: string[];
}

// =============================================================================
// Flag Interface
// =============================================================================

/**
 * Represents a command-line flag (option)
 *
 * Terminology choice: "Flag" over "Option"
 * - Modern frameworks (oclif, cobra, stricli) prefer "flag"
 * - More inclusive term covering both boolean flags and value options
 * - Alternatives considered: "Option", "Parameter", "Switch"
 */
export interface Flag<T = any> {
  /**
   * The primary name of the flag (long form)
   * Used with double dash: --name
   *
   * Naming conventions from framework analysis:
   * - kebab-case preferred (cliparse, oclif, cobra)
   * - descriptive and self-documenting
   * - avoid abbreviations unless well-known
   */
  name: string;

  /**
   * Single-character short form alias
   * Used with single dash: -n
   *
   * Alternatives considered: "alias", "char", "shorthand"
   * Most frameworks use "short" (oclif, cobra, clap)
   */
  short?: string;

  /**
   * Human-readable description for help text
   * Should be concise but descriptive
   *
   * Pattern from all frameworks: start with capital, no period
   */
  description: string;

  /**
   * Extended help text or usage examples
   * For complex flags that need more explanation
   *
   * Inspired by cobra's Long field and clig.dev best practices
   */
  help?: string;

  /**
   * The data type this flag accepts
   * Determines parsing behavior and validation
   *
   * Default: 'string' for most flags, 'boolean' for switches
   */
  type: FlagType;

  /**
   * Default value when flag is not provided
   * If present, flag becomes optional
   *
   * Type should match the flag's declared type
   * Pattern consistent across all frameworks
   */
  default?: T;

  /**
   * Whether this flag is required
   * Cannot be true if default is provided
   *
   * Alternatives considered: "mandatory", "necessary"
   * "required" is universal across frameworks
   */
  required?: boolean;

  /**
   * Allow multiple values for this flag
   * Results in an array of the specified type
   *
   * Examples: --file file1.txt --file file2.txt
   * Inspired by clap's multiple values and oclif's multiple flag
   */
  multiple?: boolean;

  /**
   * Additional aliases for this flag
   * Supplements the primary name and short form
   *
   * Most frameworks support multiple aliases (cobra, clap, urfave/cli)
   * Order doesn't matter, all are treated equally
   */
  aliases?: string[];

  /**
   * Custom parser function for complex validation
   * Only used when type is 'custom'
   *
   * Inspired by cliparse's robust parser system
   * and optique's functional parsing approach
   */
  parser?: Parser<T>;

  /**
   * Shell completion function
   * Provides dynamic completion suggestions
   *
   * Pattern from oclif and cobra's completion systems
   * Can be async for API-based completions
   */
  completion?: CompletionFunction;

  /**
   * Placeholder text for help documentation
   * Shows expected value format in usage examples
   *
   * Alternatives considered: "metavar", "valueName", "placeholder"
   * "metavar" from cliparse, "placeholder" more intuitive
   */
  placeholder?: string;

  /**
   * Hide this flag from help output
   * Useful for deprecated or internal flags
   *
   * Pattern from oclif and cobra for hidden options
   */
  hidden?: boolean;

  /**
   * Flag is inherited by all subcommands
   * Also known as "global" flags
   *
   * Terminology from cobra: "persistent flags"
   * Alternatives: "global", "inherited", "shared"
   */
  persistent?: boolean;

  /**
   * Group this flag belongs to for help organization
   * Groups related flags together in help output
   *
   * Feature from cobra and advanced CLI frameworks
   * Helps organize complex command interfaces
   */
  group?: string;

  /**
   * Other flags that cannot be used with this one
   * Enforces mutually exclusive options
   *
   * Example: --json conflicts with --csv
   * Inspired by clap's conflicts_with feature
   */
  conflicts?: string[];

  /**
   * Flags that must be present if this flag is used
   * Enforces flag dependencies
   *
   * Example: --password requires --username
   * Pattern from clap and advanced argument parsing
   */
  requires?: string[];

  /**
   * Mark this flag as deprecated
   * Shows deprecation warning when used
   *
   * Important for backward compatibility during transitions
   * Pattern from enterprise frameworks like cobra
   */
  deprecated?: boolean | string;

  /**
   * Environment variable name to check for default value
   * Follows clig.dev's configuration hierarchy
   *
   * CLI args > env vars > config files > defaults
   * Inspired by cobra's env variable integration
   */
  env?: string;
}

// =============================================================================
// Argument Interface
// =============================================================================

/**
 * Represents a positional command-line argument
 *
 * Terminology choice: "Argument" over "PositionalArgument"
 * - Shorter and more common across frameworks
 * - Context makes it clear these are positional
 * - Alternatives considered: "Operand" (from clig.dev), "Parameter"
 */
export interface Argument<T = any> {
  /**
   * The name of this argument
   * Used in help text and error messages
   *
   * Should be descriptive and match the expected content
   * Examples: "file", "app-name", "url"
   */
  name: string;

  /**
   * Human-readable description for help text
   * Explains what this argument represents
   *
   * Should describe the expected content and purpose
   */
  description: string;

  /**
   * Whether this argument is required
   * If false, argument becomes optional
   *
   * Note: Required arguments cannot come after optional ones
   * This is enforced by most CLI frameworks
   */
  required?: boolean;

  /**
   * Default value when argument is not provided
   * Only valid for optional arguments
   *
   * Type should match the expected argument type
   */
  default?: T;

  /**
   * Custom parser function for validation
   * Processes and validates the argument value
   *
   * Inspired by cliparse's argument parsing system
   * Allows complex validation and transformation
   */
  parser?: Parser<T>;

  /**
   * Accept multiple values (rest arguments)
   * Consumes all remaining positional arguments
   *
   * Must be the last argument in the list
   * Results in an array of values
   *
   * Alternatives considered: "rest", "multiple", "spread"
   * "variadic" is the technical term used in many languages
   */
  variadic?: boolean;

  /**
   * Shell completion function
   * Provides dynamic completion suggestions
   *
   * Useful for file paths, known values, etc.
   * Pattern from oclif and cobra
   */
  completion?: CompletionFunction;

  /**
   * Position of this argument (0-based)
   * Usually inferred from array order but can be explicit
   *
   * Most frameworks use array order, but explicit position
   * can be helpful for documentation and validation
   */
  position?: number;
}

// =============================================================================
// Command Interface
// =============================================================================

/**
 * Represents a CLI command or subcommand
 *
 * Commands are the main entry points for CLI actions
 * They can contain flags, arguments, and nested subcommands
 */
export interface Command {
  /**
   * The primary name of the command
   * Used to invoke the command: cli command-name
   *
   * Should be a clear, action-oriented verb when possible
   * Examples: "create", "deploy", "list", "delete"
   */
  name: string;

  /**
   * Brief description for help listings
   * Should be a short, single-line explanation
   *
   * Appears in command lists and brief help output
   * Keep under 60 characters for readability
   */
  description: string;

  /**
   * Extended help text with detailed explanation
   * Can include usage examples and detailed behavior
   *
   * Inspired by cobra's Long field and clig.dev guidelines
   * Use for complex commands that need more explanation
   */
  help?: string;

  /**
   * Alternative names for this command
   * Allows multiple ways to invoke the same command
   *
   * Examples: ["rm", "remove", "delete"] for delete command
   * Pattern from cobra and most CLI frameworks
   */
  aliases?: string[];

  /**
   * Usage examples for this command
   * Shows common use cases and syntax
   *
   * Following clig.dev best practice: lead with examples
   * Each example should be a complete, runnable command
   */
  examples?: string[];

  /**
   * Flags available for this command
   * Both local flags and inherited persistent flags
   *
   * Key is the flag name, value is the flag definition
   * Allows easy lookup and prevents name conflicts
   */
  flags?: Record<string, Flag>;

  /**
   * Positional arguments for this command
   * Order matters - required args must come first
   *
   * Array order determines argument position
   * Framework validation should enforce ordering rules
   */
  args?: Argument[];

  /**
   * Nested subcommands
   * Creates command hierarchies like "cli namespace action"
   *
   * Examples: "kubectl get pods", "git remote add"
   * Pattern from cobra and enterprise CLI tools
   */
  subcommands?: Record<string, Command>;

  /**
   * The function that executes this command
   * Receives parsed flags and arguments
   *
   * This is where the actual command logic lives
   * Should be type-safe based on flag/arg definitions
   */
  handler?: CommandHandler;

  /**
   * Hide this command from help listings
   * Useful for deprecated or internal commands
   *
   * Command still works but doesn't appear in help
   * Pattern from oclif and other frameworks
   */
  hidden?: boolean;

  /**
   * Mark this command as experimental
   * Shows warning when used, appears in help with marker
   *
   * Useful for preview features and unstable APIs
   * Inspired by clever-tools' current experimental flag
   */
  experimental?: boolean;

  /**
   * Mark this command as deprecated
   * Shows deprecation warning and migration path
   *
   * Value can be boolean or string with migration instructions
   * Important for maintaining backward compatibility
   */
  deprecated?: boolean | string;

  /**
   * Parent command (for navigation and context)
   * Automatically set when building command trees
   *
   * Useful for generating help and understanding context
   * Most frameworks compute this automatically
   */
  parent?: Command;

  /**
   * Category or group for help organization
   * Groups related commands together
   *
   * Examples: "Application Management", "Configuration"
   * Helps organize large CLI tools with many commands
   */
  category?: string;
}

// =============================================================================
// Command Handler Types
// =============================================================================

/**
 * Context passed to command handlers
 * Contains parsed values and metadata
 */
export interface CommandContext {
  /**
   * Parsed flag values
   * Key is flag name, value is parsed result
   */
  flags: Record<string, any>;

  /**
   * Parsed argument values
   * Array of values in positional order
   */
  args: any[];

  /**
   * The command that was invoked
   * Useful for accessing metadata and configuration
   */
  command: Command;

  /**
   * Raw command line arguments
   * For special cases where raw access is needed
   */
  raw: string[];
}

/**
 * Command handler function signature
 * Executes the actual command logic
 */
export type CommandHandler = (context: CommandContext) => Promise<void> | void;

// =============================================================================
// Built-in Parsers
// =============================================================================

/**
 * Built-in parser functions for common types
 * Inspired by the parser libraries in various frameworks
 */
export interface BuiltInParsers {
  /**
   * Parse string value (identity function with validation)
   * Can check for empty strings, length, patterns
   */
  string(options?: { minLength?: number; maxLength?: number; pattern?: RegExp }): Parser<string>;

  /**
   * Parse integer value
   * Validates and converts to integer
   */
  integer(options?: { min?: number; max?: number }): Parser<number>;

  /**
   * Parse float/number value
   * Validates and converts to number
   */
  number(options?: { min?: number; max?: number }): Parser<number>;

  /**
   * Parse boolean value
   * Handles various true/false representations
   */
  boolean(): Parser<boolean>;

  /**
   * Parse URL value
   * Validates URL format and optionally protocol
   */
  url(options?: { protocols?: string[] }): Parser<URL>;

  /**
   * Parse file path
   * Validates file existence and accessibility
   */
  file(options?: { exists?: boolean; readable?: boolean; writable?: boolean }): Parser<string>;

  /**
   * Parse from enumerated values
   * Restricts input to specific allowed values
   */
  enum<T extends string>(values: T[]): Parser<T>;
}

// =============================================================================
// Framework Adapter Interface
// =============================================================================

/**
 * Interface for adapting this abstraction to specific CLI frameworks
 * Allows pluggable framework backends
 */
export interface FrameworkAdapter {
  /**
   * Convert our command definition to framework-specific format
   * Each adapter implements mapping to their target framework
   */
  adaptCommand(command: Command): any;

  /**
   * Parse command line arguments using the target framework
   * Returns standardized result format
   */
  parse(args: string[], command: Command): CommandContext;

  /**
   * Generate help text using the target framework
   * Should maintain consistent help format across adapters
   */
  generateHelp(command: Command): string;
}

// =============================================================================
// Utility Types
// =============================================================================

/**
 * Extract flag types from a command for type safety
 * Allows TypeScript to infer correct types in handlers
 */
export type ExtractFlags<T extends Command> = T extends { flags: infer F }
  ? F extends Record<string, Flag<infer U>>
    ? Record<keyof F, U>
    : Record<string, any>
  : Record<string, any>;

/**
 * Extract argument types from a command for type safety
 * Provides type checking for argument access in handlers
 */
export type ExtractArgs<T extends Command> = T extends { args: readonly Argument<infer U>[] } ? U[] : any[];
