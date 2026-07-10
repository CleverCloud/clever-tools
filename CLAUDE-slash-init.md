# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

`clever-tools` is the official CLI for Clever Cloud (a PaaS). It is a pure-ESM Node.js 22+ project, distributed both as an npm package and as self-contained binaries (Rollup bundles the ESM source to CJS, then `@yao-pkg/pkg` compiles it).

## Commands

```bash
npm run validate      # lint + format:check + typecheck + docs:check — run this before committing
npm run fix-all       # lint:fix + docs + format — auto-fixes most validation failures

npm run lint          # eslint (flat config, @clevercloud/eslint-config)
npm run format        # prettier --write
npm run typecheck     # tsc — only covers scripts/, src/config/, src/logger.js and a few src/lib files
npm run docs          # regenerate command documentation (see below)
npm run docs:check    # verify docs are in sync without writing

node bin/clever.js <command>     # run the CLI from source, no build step
node bin/clever.js <command> -v  # verbose mode (sets CLEVER_VERBOSE, prints debug logs + stacktraces)
```

There is **no test suite** in this repository. Verify changes by running the CLI directly.

Commits must follow Conventional Commits (enforced by a `commit-msg` git hook — enable with `git config core.hooksPath '.githooks'`). The scope should be the command name, e.g. `feat(env): add JSON output format`. Only `feat`, `fix` and `perf` reach the changelog.

## Architecture

### Command definition system

Commands are declarative objects, not cliparse calls. Three helpers in `src/lib/` (`define-command.js`, `define-option.js`, `define-argument.js`) are identity functions whose only job is to attach the types declared in the sibling `.types.d.ts` files — that is where the real contract lives. Zod schemas on options and arguments drive validation, coercion, defaults, autocompletion values, and TypeScript inference of the handler signature.

The chain looks like this:

1. `src/commands/<cmd>/<cmd>.command.js` (and `<cmd>.<sub>.command.js`) export `defineCommand({ description, since, options, args, handler })`.
2. `src/commands/global.commands.js` is the single registry. A leaf is a command; a group is a `[command, { sub: subcommand }]` tuple. Nothing is discovered by convention — a command not listed here does not exist.
3. `bin/clever.js` walks that tree and converts each definition into a `cliparse` command, wiring `schema.safeParse` as the parser for every option and argument.
4. `src/lib/cliparse-patched.js` monkey-patches `cliparse` to catch handler rejections (logging via `Logger.error` then `process.exit(1)`), fix an upstream `parseList` error-payload bug, and render `--help` from the original definitions rather than cliparse's own metadata. The original definition is stashed on `command._definition` for this purpose.

Two consequences worth knowing:

- **Option keys vs option names.** In `defineCommand({ options })`, the record *key* is what the handler receives (`options.indexPrefix`), while `defineOption({ name })` is the CLI flag (`--index-prefix`). `mapOptionsToDefinitionKeys` in `cliparse-patched.js` bridges the two.
- **`clever curl` bypasses the parser entirely.** `bin/clever.js` special-cases it before `cliparse.parse`, because cliparse rejects unknown options and `curl` must forward arbitrary ones.

Reuse options and arguments from `src/commands/global.options.js` and `src/commands/global.args.js` before defining new ones.

### `since` and the release flow

`since` is a required field. New commands are committed with `since: null`; `scripts/resolve-since.js` runs on the release-please branch, parses each `*.command.js` with the TypeScript compiler API, and rewrites `null` to the upcoming version. Never guess a version by hand — `null` is the correct value for unreleased work.

### Experimental features

`src/config/features.js` holds `EXPERIMENTAL_FEATURES` (currently `system-git`, `k8s`, `kv`, `ng`, `operators`), each with a status and user-facing instructions. A command carrying `featureFlag: 'ng'` is filtered out of the command tree at startup unless the user enabled it via `clever features enable ng` (persisted in `clever-tools-experimental-features.json`). `isExperimental: true` additionally paints the description yellow with the status tag.

### Layers below the commands

- `src/models/` — business logic and orchestration. `application.js`, `addon.js`, `ng.js`, `ids-resolver.js` etc. Handlers resolve user-supplied names to IDs here (`Application.resolveId(appIdOrName, alias)` returns `{ ownerId, appId }`).
- `src/clever-client/` — request builders for API endpoints not yet available in `@clevercloud/client` (drains, k8s, ng, operators, auth-bridge). They return plain `{ method, url, headers, queryParams }` objects, deliberately shaped like the upstream client so they can be moved there later.
- `src/models/send-to-api.js` — the single egress point. Every request goes through `prefixUrl(host)` → `addOauthHeader(tokens)` → `request` → `processError`, which translates network and auth failures into actionable messages. Use `sendToApi` (or `sendToAuthBridge`, `sendToApiWithConfig`).
- `src/config/config.js` — Zod-validated config resolved from environment variables, schema defaults, and the active profile's `overrides`. `baseConfig` is the same thing *without* profile overrides — use it when operating on a specific profile (login, profile switch) to avoid the active profile bleeding in.
- `src/parsers.js` — transform functions plugged into Zod schemas (`z.string().transform(appIdOrName)`). They turn a string into the discriminated shape the API expects, e.g. `{ app_id }` vs `{ app_name }`.
- `src/logger.js` — **always use `Logger`, never `console.log`.** `Logger.println` for stdout, `printSuccess`/`printInfo` for decorated lines, `printJson` for `--format json`, `debug`/`info` (verbose-only), `error` (stderr, adds stacktrace when verbose).

Commands that produce structured data should take `humanJsonOutputFormatOption` and branch on it.

## Documentation generation

`npm run docs` runs `scripts/generate-docs.js`, which reads `globalCommands` and writes three things:

- `src/commands/<cmd>/<cmd>.docs.md` — one per top-level command
- `src/commands/README.md` — the command index
- `skills/clever-tools/references/full-documentation.md` — the LLM-oriented doc, which also pulls live runtime/addon/zone lists from the public API (so this needs network access)

In the `.docs.md` files the `### 📥 Arguments` and `### ⚙️ Options` tables, the `Since` badges and the command list are regenerated every time; any other H3 section you add (examples, notes, see-also) is preserved. Edit the command definition, not the table.

`npm run docs:check` is part of `npm run validate`, so CI fails if you change a description, option or argument without regenerating. Commit the `.docs.md` alongside the command file.

## Further reading

`CONTRIBUTING.md` covers the full command-authoring walkthrough, the preview-build system (`scripts/preview.js`), and the CI/CD release pipeline. `docs/adr/adr-0001-rework-file-structure.md` explains why the command definition system looks the way it does.
