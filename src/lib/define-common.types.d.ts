/**
 * Completion function signature for shell autocompletion.
 * Can be sync or async for API-based completions.
 */
export type CompletionFunction = (context?: CompletionContext) => string[] | Promise<string[]>;

/**
 * Completion context provided to completion functions.
 * Contains partial command state for intelligent completion.
 */
interface CompletionContext {
  /** The current partial input being completed */
  current?: string;
  /** Previously parsed option values */
  options?: Record<string, unknown>;
  /** Previously parsed argument values */
  args?: unknown[];
}
