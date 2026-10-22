/** Mock of the env vars of the program under test. */
export class EnvMock {
  #variables: Record<string, string> = {};

  /** Set a variable, overriding the previous value if any. */
  set(name: string, value: string): void;
  /** Set several variables at once, same as one `set(name, value)` per entry, in order. */
  set(vars: Record<string, string>): void;
  set(...args: [name: string, value: string] | [vars: Record<string, string>]): void {
    const vars = args.length === 1 ? args[0] : { [args[0]]: args[1] };
    Object.assign(this.#variables, vars);
  }

  /** Remove a variable. */
  unset(name: string): void {
    delete this.#variables[name];
  }

  /** Forget every `set()` and `unset()`, and start again from a copy of `defaults`. */
  reset(defaults: Record<string, string> = {}): void {
    this.#variables = { ...defaults };
  }

  /** Return a copy of the current variables, e.g. to use as the `env` of a process. */
  toEnv(): Record<string, string> {
    return { ...this.#variables };
  }
}
