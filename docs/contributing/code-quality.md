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

`npm run validate` runs the last five locally. `npm run fix-all` fixes what can be fixed automatically (`lint:fix`, `docs`, `format`). The commit checks are described in [issues-commits-and-prs.md](issues-commits-and-prs.md), the documentation check in [docs-generation.md](docs-generation.md), the unit tests in [testing.md](testing.md).

## Linting

[ESLint](https://eslint.org), flat config (`eslint.config.js`) based on the shared [`@clevercloud/eslint-config`](https://github.com/CleverCloud/tooling-javascript). `npm run lint` reports, `npm run lint:fix` fixes what it can.

## Formatting

[Prettier](https://prettier.io): `npm run format` formats every file, `npm run format:check` only reports. Prettier ignores Markdown (`.prettierignore`): format `.md` files by hand, following the surrounding style.

## Type checking

[TypeScript](https://www.typescriptlang.org): the code is plain JavaScript typed with JSDoc comments (plus a few `*.types.d.ts` declaration files), checked by `tsc` without transpilation. `npm run typecheck` only covers the files listed in the `include` of `tsconfig.json`: check the list before assuming a file is checked.

For now, source files stay `.js` with JSDoc types: don't write new code in `.ts` or convert an existing file. A move of every file to `.ts` is planned, the JSDoc types are the first step (see [code-style.md](code-style.md#types)). The only `.ts` files are the unit tests (`*.test.ts`, see [testing.md](testing.md)).

## Claude Code hook

Claude Code runs ESLint (with `--fix`) and Prettier on each file it edits, through a `PostToolUse` hook (`.claude/settings.json`, which calls `.claude/hooks/lint-format.js`). Remaining ESLint errors are fed back to the agent.

The hook is a script because Claude Code passes the payload on stdin as JSON: the script reads the edited file path, runs the checks on that file only (`npm run format` would format the whole repository) and exits with code 2, which is how errors reach the agent.
