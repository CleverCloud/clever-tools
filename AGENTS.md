# clever-tools

The official Clever Cloud CLI (`clever`), published on npm as `clever-tools` and as self-contained binaries (Homebrew, AUR, WinGet, Docker, DEB/RPM…).
Plain JavaScript checked with `tsc` (JSDoc types, plus a few `*.types.d.ts` declaration files for complex types), no TypeScript compiled at runtime (unit tests are `*.test.ts` files run natively by Node), ESM only, Node 24+, `npm` as package manager, exact Node/npm versions pinned in `mise.toml`.

This file is the canonical instruction set for AI coding agents.

## Always do this

- **Once you consider the work finished, not after each edit, run `npm run fix-all` then `npm run validate`, and fix what it reports.**
  - `fix-all` fixes lint issues, formats the code and regenerates the documentation of the commands: commit the generated files with the change.
  - `validate` checks lint, format, types, generated docs and unit tests.
  - Claude Code already lints and formats every file it edits through a hook, so it can skip `fix-all` and only run `validate`.
- **A unit test suite is being built, don't add tests to existing code now.** A few unit tests exist and run in the CI (`npm test`), so the setup is ready, but work in progress will add many tests at once, and the rest will be handled later.
  - Exception: a brand new standalone util or helper can come with its unit test.
  - To verify a behaviour change, run the affected command from source with `node bin/clever.js <command>`, read-only commands first (see "Running the CLI").
- **Before writing a new pattern, look at how a similar command does it.** Copy the closest neighbour (naming, file layout, output format, error messages) rather than inventing.
- **Never add a dependency without discussing it in the issue first.** Prefer native JavaScript, and don't use `lodash` in new code (see `docs/contributing/code-style.md`).
- **Commit messages follow [conventional commits](https://www.conventionalcommits.org)**, scope = the command name: `fix(drain): ...`. Only `feat`, `fix`, `perf` and `revert` reach the CHANGELOG, so the type and scope are the release note. No `fixup!` / `squash!` commits, branch rebased on `master` (CI rejects both).
- **Every PR addresses an existing issue** (`Closes #N`) and follows `.github/pull_request_template.md`. Keep it limited to what the issue needs: unrelated fixes and refactors go in their own issue and PR.

## Layout

| Path | What |
|---|---|
| `bin/clever.js` | Entry point: builds the `cliparse` tree from `globalCommands`, hides commands behind disabled feature flags |
| `src/commands/<command>/` | One directory per root command: `<command>.command.js`, `<command>.<sub>.command.js`, `<command>.args.js` and `<command>.options.js` when shared by several subcommands, generated `<command>.docs.md` |
| `src/commands/global.commands.js` | Registry of every command, the tree the CLI and the docs generator walk |
| `src/commands/global.options.js`, `global.args.js` | Options and arguments shared across commands (`--app`, `--alias`, `--org`, `--format`, `--yes`…) |
| `src/lib/` | Command definition helpers (`define-*.js` + `.types.d.ts`), prompts, formatting, k8s and operators helpers. New shared code goes here |
| `src/models/` | Historically API access helpers, now also business logic: app/addon resolution, git, logs, `send-to-api.js` |
| `src/clever-client/` | API endpoints not yet available in `@clevercloud/client`, written in the same request-params style |
| `src/config/` | Runtime configuration (env vars, profiles, config file paths), experimental features |
| `src/parsers.js` | Zod transformers used by options and arguments |
| `src/logger.js` | `Logger`, the only way commands print |
| `scripts/` | Development and CI scripts (build, docs, previews, publication), not shipped in the package, except `*.sh` (typechecked) |
| `skills/clever-tools/` | Agent skill shipped **to CLI users** (`npx skills add CleverCloud/clever-tools`), not instructions for this repository |
| `docs/` | User guides, ADRs (`docs/adr/`) and contributor docs (`docs/contributing/`) |

## Command anatomy

Commands are declared with `defineCommand()` / `defineOption()` / `defineArgument()` and Zod schemas, on top of `cliparse` (see `docs/adr/adr-0001-rework-file-structure.md`).

- One file per command or subcommand, exporting a `defineCommand({ description, since, options, args, handler })`. A command group has `handler: null`.
- Register it in `src/commands/global.commands.js`, then run `npm run docs`.
- **A new command uses `since: null`.** The release workflow sets the version (`scripts/resolve-since.js`). Never change the `since` of a released command.
- Reuse `global.options.js` / `global.args.js` before defining a new option. Arguments and options shared by several subcommands of the same command go in `<command>.args.js` / `<command>.options.js`.
- Validation and parsing live in the Zod `schema` of the option or argument, not in the handler.
- Print through `Logger` (`src/logger.js`), never `console.log`. Machine-readable output goes through `--format json` (`humanJsonOutputFormatOption`) and `Logger.printJson()`.
- Fail by throwing an `Error` with a message the user can act on: `src/lib/cliparse-patched.js` prints it through `Logger.error()` and the process exits with code 1. To forward another exit code, set `process.exitCode` (see `ssh.command.js`) rather than calling `process.exit()`, so piped output gets flushed.
- Destructive commands ask for confirmation with `src/lib/prompts.js` and accept `--yes` (`skipConfirmationOption`) to skip it.
- Talk to the API through `@clevercloud/client` + `sendToApi`. An endpoint missing from the client goes in `src/clever-client/`.
- Commands behind a feature flag declare `featureFlag` (and `isExperimental`) and are hidden until `clever features enable <flag>`.

## Gotchas

- **Command documentation is generated, edit only what the generator preserves:**
  - `src/commands/*/*.docs.md`: add your own `###` sections under a command (examples, notes). Don't touch the rest (title, description, usage, `📥 Arguments`, `⚙️ Options`).
  - `src/commands/README.md` and `skills/clever-tools/references/full-documentation.md`: don't edit.
- **`npm run docs` and `npm run docs:check` call the public Clever Cloud API** (products, runtimes, zones) to build the skill reference. They need network, and `docs:check` can fail because the API data changed, not because of your change.
- **`src/lib/` and `src/models/` overlap:** the split is no longer meaningful. `src/models/` was meant to ease API access and later collected other logic. Put new code in `src/lib/`, and only extend `src/models/` when the change belongs to an existing model.
- **Typechecking is opt-in per file:** the codebase is being migrated to TypeScript, through JSDoc, one file at a time. `npm run typecheck` only covers what the `include` of `tsconfig.json` lists. Check the list before assuming a file is checked.
- **Prettier ignores Markdown** (`.prettierignore`): format `.md` files by hand, following the surrounding style.
- **Node versions are pinned twice:** `mise.toml` for local setups, and the `volta` field of `package.json`, which the CI (`actions/setup-node`) and `scripts/lib/build-binary.js` (target of the binaries) still read. Change both together until #1185 is done.
- **Credentials:** never read, print or copy `~/.config/clever-cloud/clever-tools.json`, `CLEVER_TOKEN`, `CLEVER_SECRET`, the output of `clever tokens create`, `gh auth token` or `~/.config/gh/hosts.yml`.
  - If a CLI is not authenticated, ask the user to log in.
  - The OAuth consumer key and secret in `src/config/config.js` are public on purpose: don't report them as a leak.
- **`skills/clever-tools/SKILL.md` is written by hand:** `npm run docs` only regenerates `skills/clever-tools/references/full-documentation.md`. When a command is added, removed or its usage changes, update `SKILL.md` if it mentions it.

## Running scripts

| | |
|---|---|
| **Safe** | `npm run lint`, `lint:fix`, `format`, `format:check`, `typecheck`, `test`, `docs`, `docs:check`, `validate`, `fix-all`, `node scripts/check-github-actions.js`, `scripts/preview.js update` |
| **Slow** | `scripts/bundle-cjs.js`, `scripts/build-binary.js`, `scripts/preview.js build` (bundle and compile binaries locally) |
| **Never run unasked** | `scripts/preview.js publish\|delete\|pr-comment`, `scripts/resolve-since.js`, `scripts/publish-*.js`, `scripts/update-github-release.js`, `npm publish`: CI runs them, most publish to shared Cellar buckets, package registries or GitHub and need secrets |

## Running the CLI

`node bin/clever.js` runs the working tree with the active profile of the developer's machine, against the production API: it acts on a real account.

- **Read-only commands are fine:** `--help`, `version`, `profile`, `applications list`, `status`, `logs`, `activity`, `addon list`, `domain`…
- **Some read-only commands print secrets:** `clever diag` prints the OAuth token of the active profile, `clever env` and `clever published-config` print the env vars of the app (database passwords, API keys…). Run them only when the task needs it, and never copy their output into an issue, a PR or a commit.
- **Anything that creates, deploys, restarts, scales, stops, deletes, or changes env vars, domains or drains must be confirmed by the user first**: it acts on production infrastructure. Never add `--yes` to skip a confirmation the user has not seen.
- **Before a command that creates, changes or deletes something, check the active profile with `clever profile`** (read-only: alias and email tell whether it is a test account). If it does not look like one, ask the user before going on. `profile switch` and `login` change the active profile in every terminal of the machine: leave them to the user.
- `profile list` also prints the OAuth consumer overrides of custom environments: prefer `profile`.
- Without `--app` / `--alias`, a command targets the app linked by `.clever.json` in the current directory (gitignored). Prefer an app or add-on the user names explicitly (`--app`, `--org`) over whatever it links.
- `clever features enable <flag>` writes to the developer's experimental features file: point `EXPERIMENTAL_FEATURES_FILE` to a temporary file instead (see `docs/contributing/testing.md`).
- Add `-v` (or `CLEVER_VERBOSE=1`) to see API calls, `CLEVER_QUIET=1` to silence logs. Debug output never prints credentials, keep it that way.

## GitHub

The repository is `CleverCloud/clever-tools`, the API client is `CleverCloud/clever-client.js`. Read-only `gh` calls are fine. Creating issues, PRs, comments or labels publishes on behalf of the user: an issue comes first, and a PR closes it (`Closes #N`), using the templates of `.github/`.

## Load on demand

Read these when the task matches. For a small change to an existing command, the neighbouring code is usually enough.

| Task | Read |
|---|---|
| Add or change a command, option or argument | `docs/contributing/commands.md` |
| Write or review code (style, dependencies) | `docs/contributing/code-style.md` |
| Edit a command's documentation, understand what is generated | `docs/contributing/docs-generation.md` |
| Understand where things are, in detail | `docs/contributing/codebase-map.md` |
| Call the API, add a missing endpoint, test a local client build | `docs/contributing/api-client.md` |
| Lint, format, typecheck, what CI checks | `docs/contributing/code-quality.md` |
| Write unit tests, test a change by hand, test with another account | `docs/contributing/testing.md` |
| What an npm script or a script of `scripts/` does | `docs/contributing/scripts.md` |
| Write commits, open an issue or a PR | `docs/contributing/issues-commits-and-prs.md`, `.github/ISSUE_TEMPLATE/`, `.github/pull_request_template.md` |
| CI, previews, release, packaging | `docs/contributing/build-ci-and-release.md`, `.github/workflows/` |
| User-facing behaviour of a command | `src/commands/<command>/<command>.docs.md`, `docs/*.md` |
| Why something is the way it is | `docs/adr/` |
