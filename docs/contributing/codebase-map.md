# Codebase map

Detailed map of the repository: where things live and how they are wired.

## From `clever <command>` to the API

1. `bin/clever.js` walks `globalCommands` (`src/commands/global.commands.js`) and turns every `defineCommand()` into a `cliparse` command, skipping those behind a disabled feature flag.
2. `cliparse` (patched in `src/lib/cliparse-patched.js`) parses the command line. Each option and argument goes through its Zod `schema` (`src/lib/zod-utils.js`, `src/parsers.js`).
3. The `handler(options, ...args)` of the command runs. It resolves names to IDs (`src/models/application.js`, `src/models/ids-resolver.js`), calls the API through a model or directly with `.then(sendToApi)`, and prints through `Logger`.
4. A thrown `Error` is caught by `cliparse-patched.js`, printed with `Logger.error()` (stack trace with `-v`), and the process exits with code 1.

## `src/`

Files at the root of `src/`, outside any directory:

| Path | Role |
|---|---|
| `logger.js` | `Logger`, the only way commands print. |
| `parsers.js` | Zod transformers used by options and arguments. |
| `format-table.js` | Table output. |
| `initial-setup.js`, `initial-update-notifier.js` | Run at startup: HTTP proxy setup, update notifier. |

## `src/commands/`

One directory per root command, files prefixed with the command name.

| File | Role |
|---|---|
| `<cmd>.command.js` | The root command. `handler: null` for a pure group (`addon`, `domain`…). |
| `<cmd>.<sub>.command.js` | A subcommand. Deeper levels chain the names: `k8s.nodegroups.create.command.js`. |
| `<cmd>.args.js`, `<cmd>.options.js` | Arguments and options shared by several subcommands of this command. |
| `<cmd>.docs.md` | **Partly generated** by `npm run docs`. Custom `###` sections are preserved (see [docs-generation.md](docs-generation.md)). |

Shared files at the root of `src/commands/`:

- `global.commands.js`: the registry, a tree of `{ name: command }` or `{ name: [command, { sub: subcommand }] }`. The order is the order of `clever help`.
- `global.options.js`, `global.args.js`: options and arguments reused across commands. Check them before defining a new one.
- `README.md`: **generated** index of every command.

## `src/lib/`

Generic helpers and shared logic. New shared code goes here rather than in `src/models/`.

| Path | Role |
|---|---|
| `define-command.js`, `define-option.js`, `define-argument.js` + `.types.d.ts` | Identity functions whose types infer the handler signature from the options and arguments. |
| `get-command-info.js` | Reads a command definition for `cliparse-patched.js` and the docs generator. |
| `cliparse-patched.js` | `cliparse` with the project fixes, including error printing. |
| `prompts.js` | `confirm`, `ask`, `selectAnswer`… on top of `@inquirer/prompts`, with non-interactive hints. |
| `style-text.js`, `format-table.js` (in `src/`), `print-items-by-owner.js`, `ascii.js` | Output formatting. |
| `k8s.js`, `operator-commands.js`, `ng-print.js` | Shared logic of the k8s, operators (keycloak, matomo, metabase, otoroshi) and network group commands. |
| `profile.js` | Profile helpers used by `login` and `profile`. |

## `src/models/`

Historically API access helpers, now also business logic: the split with `src/lib/` is no longer meaningful. Only extend a model when the change belongs to it. Organised by domain (application, add-on, domain, drain, deployments, logs, network groups, operators…).

Cross-cutting ones:

| Path | Role |
|---|---|
| `send-to-api.js` | `sendToApi` and friends, see [api-client.md](api-client.md). |
| `ids-resolver.js` | Name or ID to owner, add-on, OAuth consumer, with a local cache. |
| `clever-json.js` | Reads and writes `.clever.json`, the apps linked to the current directory. |
| `application-config.js` | The settings of an application handled by `clever config` (name, zero-downtime, sticky sessions…): list, parse, format, print. |
| `git.js`, `git-system.js`, `git-isomorphic.js` | Deployment through the system `git` or `isomorphic-git`. |
| `run-ssh-command.js` | SSH sessions (`clever ssh`). |

## `src/clever-client/`

Request builders for API endpoints missing from `@clevercloud/client` (auth bridge, drains, k8s, network groups, operators). See [api-client.md](api-client.md).

## `src/config/`

| Path | Role |
|---|---|
| `config.js` | The runtime configuration: environment variables, then active profile overrides, then defaults. `CLEVER_TOKEN` + `CLEVER_SECRET` inject a virtual `$env` profile. |
| `paths.js` | Config directory: XDG (`~/.config/clever-cloud/`), `%APPDATA%\clever-cloud` on Windows. |
| `features.js` | Experimental features and their enabled state. |
| `cache.js` | IDs cache. |

Every key of the config schema can be overridden with an environment variable of the same name (`API_HOST`, `CONFIGURATION_FILE`, `EXPERIMENTAL_FEATURES_FILE`…).

## `scripts/`

Node scripts for development and the CI (build, docs, previews, publication), behind the `npm` scripts and the workflows. They are not shipped in the npm package: only `scripts/*.sh` (shell completion) are. They are typechecked and share helpers in `scripts/lib/`. `templates/` holds the package manager templates (AUR, Homebrew, Exherbo, Docker Hub, nfpm). What each script does is in [scripts.md](scripts.md).

## See also

- [commands.md](commands.md): how to write a command.
- [code-style.md](code-style.md): how we write code.
- [api-client.md](api-client.md): calling the API and adding a missing endpoint.
- [docs-generation.md](docs-generation.md): generated files and what you can edit.
- [code-quality.md](code-quality.md): the checks run by `npm run validate` and the CI.
- [testing.md](testing.md): unit tests and manual testing.
- [scripts.md](scripts.md): what each npm script and each script of `scripts/` does.
- [issues-commits-and-prs.md](issues-commits-and-prs.md): issues, commit messages and pull requests.
