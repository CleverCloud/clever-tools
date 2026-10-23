# Code quality

## What the CI checks

The `code-quality.yml` workflow runs on every PR (except release-please PRs), in this order:

| Check | Command |
|---|---|
| Commit messages follow Conventional Commits | `npx commitlint --from=origin/master --to=HEAD` |
| No `fixup!` / `squash!` commits | |
| The branch is rebased on the latest `master` | |
| Linting (ESLint) | `npm run lint` |
| Formatting (Prettier) | `npm run format:check` |
| Type checking (TypeScript) | `npm run typecheck` |
| Generated documentation is up to date | `npm run docs:check` |
| Unit tests | `npm test` |

Run the last five locally with `npm run validate`, and fix what can be fixed automatically with `npm run fix-all` (see [npm scripts](#npm-scripts)). The commit checks are described in [issues-commits-and-prs.md](issues-commits-and-prs.md), the documentation check in [docs-generation.md](docs-generation.md), the unit tests in [testing.md](testing.md).

## npm scripts

| Script | What it does |
|---|---|
| `npm run lint` | Runs ESLint on the `.js` files of `bin/`, `src/`, `scripts/` and `.claude/hooks/`, and on the `.ts` files. |
| `npm run lint:fix` | Runs ESLint and fixes what can be fixed automatically. |
| `npm run format` | Formats every file with Prettier (Markdown excluded). |
| `npm run format:check` | Checks the formatting without changing files. |
| `npm run typecheck` | Typechecks the files listed in the `include` of `tsconfig.json` and the files they import. |
| `npm test` | Runs the unit tests (`src/**/*.test.ts`) with the Node.js test runner (see [testing.md](testing.md)). Modules are mocked with the native `node:test` mocks, still experimental, hence `--experimental-test-module-mocks`. |
| `npm run docs` | Regenerates the documentation from the command definitions (see [docs-generation.md](docs-generation.md)). Calls the public Clever Cloud API. |
| `npm run docs:check` | Checks that the generated documentation is up to date, without writing files. |
| `npm run validate` | Runs `lint`, `format:check`, `typecheck`, `docs:check` and `test`, like the CI. |
| `npm run fix-all` | Runs `lint:fix`, `docs` and `format`. |
| `npm run install-local:cliparse` | Packs `../cliparse-node` and installs it in place of the published `cliparse`. Rewrites `package.json`: undo it before committing. |

The Node.js scripts of `scripts/` (build, previews, release) are described in [build-ci-and-release.md](build-ci-and-release.md#scripts).

## Linting

[ESLint](https://eslint.org), flat config (`eslint.config.js`) based on the shared [`@clevercloud/eslint-config`](https://github.com/CleverCloud/tooling-javascript).

## Formatting

[Prettier](https://prettier.io). It ignores Markdown (`.prettierignore`): format `.md` files by hand, following the surrounding style.

## Type checking

[TypeScript](https://www.typescriptlang.org): the code is plain JavaScript typed with JSDoc comments (plus a few `*.types.d.ts` declaration files), checked by `tsc` without transpilation. `npm run typecheck` checks the files listed in the `include` of `tsconfig.json` and the files they import: run `npx tsc -p tsconfig.json --listFiles` before assuming a file is checked or not.

For now, source files stay `.js` with JSDoc types: don't write new code in `.ts` or convert an existing file. A move of every file to `.ts` is planned, the JSDoc types are the first step (see [code-style.md](code-style.md#types)). The only `.ts` files are the unit tests (`*.test.ts`, see [testing.md](testing.md)).

## Claude Code hook

Claude Code runs ESLint (with `--fix`) and Prettier on each file it edits, through a `PostToolUse` hook (`.claude/settings.json`, which calls `.claude/hooks/lint-format.js`). Remaining ESLint errors and Prettier failures (a file it can't parse) are fed back to the agent. The tools are called without a shell, and files outside the repository (symlinks included) are skipped.

The hook is a script because Claude Code passes the payload on stdin as JSON: the script reads the edited file path, runs the checks on that file only (`npm run format` would format the whole repository) and exits with code 2, which is how errors reach the agent.
