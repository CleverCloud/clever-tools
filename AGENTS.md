# AGENTS.md

Guidance for coding agents working on clever-tools. [CONTRIBUTING.md](CONTRIBUTING.md) is the reference, read it before changing anything. This file only recalls the rules that matter most.

## Scope

- Every PR addresses an existing issue. If there is none, open one first and discuss it there.
- The PR description references it (`Closes #N`) and follows `.github/pull_request_template.md`.
- Keep the PR limited to what the issue needs. Unrelated fixes or refactors go in their own issue and PR.

## Code

- Follow what similar commands already do before inventing something: naming, file layout, output format, error messages.
- Reuse existing helpers: `defineCommand`, `defineOption` and `defineArgument` from `src/lib/`, shared options and arguments from `src/commands/global.options.js` and `src/commands/global.args.js`, logic in `src/models/`.
- Talk to the API through `@clevercloud/client`. Do not add a dependency without discussing it in the issue.
- Commands print through `Logger` (`src/logger.js`), never `console.log`.
- A new command uses `since: null`: the release workflow sets the version (`scripts/resolve-since.js`). Keep the `since` of already released commands.

## Documentation

- When behaviour changes, update the related documentation and examples.
- After changing a command (description, options, arguments), run `npm run docs` and commit the generated files.
- Do not edit generated sections by hand. Custom `###` sections in `*.docs.md` files are preserved.

## Before pushing

- `npm run validate` passes (lint, format, typecheck, docs).
- For CLI behaviour changes, run the affected commands with `node bin/clever.js` and describe the result in the PR.
- Commits follow Conventional Commits, scoped to the command when relevant (`fix(ssh): ...`). Only `feat`, `fix` and `perf` reach the changelog.
- The branch is rebased on `master` and has no `fixup!` or `squash!` commits.
