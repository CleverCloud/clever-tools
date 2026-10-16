# Code style

How we write code in clever-tools, in JavaScript for now (see [Types](#types)). ESLint and Prettier enforce the rest (see [code-quality.md](code-quality.md)): this guide only covers what they cannot check.

Each rule is tagged **Observed** (what the code does today) or **Preferred** (the direction for new code, not yet applied everywhere). **Do** and **Avoid** give a short example of a rule. When old and new code disagree, follow the newer code (`src/lib/`, `define-*`, `src/config/`) and do not rewrite old code in an unrelated PR.

## Language and modules

- **Observed:** ESM only, Node 24+.
- **Observed:** Namespace imports are used to keep a model readable at the call site: `import * as Application from '../../models/application.js'`.
- **Observed:** `function` declarations for named helpers, arrow functions for callbacks.

## Types

The codebase has always been plain JavaScript. We are in a transition phase: JSDoc types are added wherever possible, and each file that is fully typed is added to the `include` of `tsconfig.json`, so that `tsc` checks it (see [code-quality.md](code-quality.md#type-checking)). A larger step is planned afterwards: moving every file to `.ts`, with TypeScript syntax instead of JSDoc (Node.js runs `.ts` files natively, as it already does for the unit tests). The code is already type-checked by TypeScript through JSDoc, what changes is the file format.

Until then, write everything in JavaScript, with JSDoc for anything new. Don't rename a file to `.ts` or write a new one in it (unit tests excepted).

- **Observed:** Typechecking is opt-in per file: the `include` of `tsconfig.json` lists the entry points, and `tsc` also checks the files they import (`npx tsc -p tsconfig.json --listFiles` shows them all). The listed files have complete JSDoc, see `src/lib/date-utils.js`.
- **Observed:** Complex shapes go in a `*.types.d.ts` next to the code (`src/lib/define-command.types.d.ts`).
- **Preferred:** Add JSDoc (`@param`, `@returns`) to new functions, even when the file is not typechecked yet, and add the file to `tsconfig.json` once it is fully typed.

## JSDoc

Typed files describe their functions in JSDoc, see `src/lib/date-utils.js`:

```js
/**
 * Formats a date to localized display format (e.g. "Feb 5, 2027, 14:16 UTC").
 * Returns undefined when the input is nullish.
 * @param {Date | undefined | null} date
 * @returns {string | undefined}
 */
```

- **Observed:** A short description, then `@param {Type} name - description` (the description is left out when the name and the type say everything) and `@returns {Type}`. Use `@returns`, not `@return`.
- **Observed:** Unions and nullable types are written `{string | number | Date}` and `{Date | undefined | null}`.
- **Observed:** An optional parameter is `[name]`, with its default `[name=value]`.
- **Observed:** An object parameter is described property by property (`@param {Object} config`, then `@param {string} config.host`), or inline for a tiny shape (`{{ cwd?: string, quiet?: boolean }}`).
- **Observed:** A shape used in several places is a `@typedef` with `@property` lines, or a `*.types.d.ts` file imported with `@typedef {import('./get-command-info.types.d.ts').CommandInfo} CommandInfo`.
- **Observed:** A function that throws on purpose declares it: `@throws {Error} If the file cannot be read or parsed` (`src/lib/fs.js`).
- **Preferred:** `unknown` rather than `any`, and a reason after `@ts-expect-error`.

## Naming

| Thing | Convention | Example |
|---|---|---|
| Files | kebab-case, command files prefixed with the command name | `print-items-by-owner.js`, `drain.create.command.js` |
| Variables, functions | camelCase, verbs for functions | `selectBest`, `getInstanceType` |
| Classes | PascalCase | `Logger` |
| Module constants | `UPPER_SNAKE_CASE` | `DISTRIBUTED_COMPONENTS` in `src/lib/k8s.js` |
| Unused parameters or destructured values | `_` prefix | `([_name, count]) => count > 1` |
| Private class members | `#` fields and methods | `#getRepo()` in `src/models/git-isomorphic.js` |

The `camelcase` rule allows a few API field names (`app_id`, `orga_id`…), see `eslint.config.js`.

## Async code

- **Observed:** `async`/`await` is the norm. The one chaining idiom kept on purpose is the API call: `await getAllApps().then(sendToApi)`, because client functions return a promise of the request params, and `sendToApi` sends the request.
- **Do:** `const apps = await getAllApps().then(sendToApi);`
- **Avoid:** other `.then()` chains and nested callbacks in new code, use `await` and a local variable.
- **Observed:** loops use `for (const x of xs)` more than `.forEach`. **Preferred:** `for...of` when the body has side effects or awaits.

## Errors and output

- **Observed:** Fail with `throw new Error('...')` and a message the user can act on (`src/models/variables.js`). No custom exit handling, see [commands.md](commands.md). For another exit code set `process.exitCode`, never `process.exit()` (`src/commands/ssh/ssh.command.js`).
- **Observed:** Output goes through `Logger` (`Logger.println`, `Logger.printJson`, `Logger.error`…). **Avoid** `console.log` in commands.
- **Observed:** Style terminal text with `styleText` from `src/lib/style-text.js`, not with a color library.
- **Observed:** Validation and parsing of user input live in Zod schemas (`src/parsers.js`, `src/lib/zod-utils.js`), not in handlers.

## Data handling

- **Observed:** Nullish checks use `== null` / `!= null`, `=== undefined` is not used. `eqeqeq` allows it. Optional chaining and `??` are common: `(product.topologies ?? []).flatMap(...)`.
- **Observed:** Native collections and helpers are already the norm in recent code: `Object.groupBy` (`src/lib/print-items-by-owner.js`), `Object.fromEntries`, `flatMap`, `Set`, `Map`, `.at(-1)`, `structuredClone` (`src/models/application.js`).
- **Preferred:** Do not mutate arguments or API responses. Build new values with `map`, `filter`, spread or `structuredClone`, and use `toSorted()` / `toReversed()` instead of `sort()` / `reverse()` on shared arrays.

## Tests

- **Observed:** A unit test is a `*.test.ts` file next to the module, with `describe` / `it` from `node:test` and assertions from `node:assert`. A test name is a sentence about the behaviour: `keeps all drains without a type` (`src/models/drain.test.ts`). Mocks and setup helpers: `src/config/config.test.ts`.

How to run them, and when to add one, is in [testing.md](testing.md).

## Comments

- **Observed:** JSDoc blocks on exported helpers, short `//` comments that explain why (`src/commands/ssh/ssh.command.js`), not what. `TODO:` is used for known gaps.
- **Preferred:** No commented-out code, no comment that restates the next line.

## Dependencies

**Preferred:** JavaScript native first. Before adding a package, check that the platform (Node 24) does not already do it, and never add a dependency without discussing it in the issue.

Lean on the built-in `Array` methods (`filter`, `find`, `map`, `flatMap`, `some`, `every`, `reduce`, `at`, `toSorted`), the `Object` methods (`entries`, `fromEntries`, `keys`, `values`, `groupBy`), `Map` and `Set`, optional chaining and nullish coalescing, rather than a utility library.

`lodash` is a dependency we want to remove. **Do not use it in new code.** It is still imported in a few files of `src/`: when you touch one of those calls for another reason, replace it with native JavaScript.
