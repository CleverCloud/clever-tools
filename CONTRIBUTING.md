# Contributing to clever-tools

Thank you for your interest in clever-tools. This guide covers the setup and the contribution workflow, and points to the detailed contributor guides.

## Prerequisites

### Essential

- Git
- Node.js 24 or higher (includes npm). Any 24+ works; the exact versions used by the project are pinned in `mise.toml` (see Recommended).
- A [Clever Cloud account](https://console.clever-cloud.com/users/me/information) (needed to test CLI commands)

### Recommended

- [mise](https://mise.jdx.dev) to install the pinned Node.js and npm versions. The `volta` field of `package.json` is only there for the CI and `scripts/lib/build-binary.js` (Node.js version embedded in the binaries) for now, it is not the recommended way to set up your machine.
- [GitHub CLI](https://cli.github.com) (`gh`) to read issues and pull requests, and to open yours.
- [Docker](https://www.docker.com) to build and test the Docker image locally (see [build-ci-and-release.md](docs/contributing/build-ci-and-release.md#docker-image)).

## Getting started

```bash
# 1. Fork the repository on GitHub, then clone your fork
git clone https://github.com/<your-username>/clever-tools.git
cd clever-tools

# 2. Install dependencies and enable the commit-msg hook (commitlint)
npm install
git config core.hooksPath '.githooks'

# 3. Create a development alias (optional, `cleverr` below stands for `node bin/clever.js`)
echo "alias cleverr='node $(pwd)/bin/clever.js'" >> ~/.bashrc
source ~/.bashrc

# 4. Verify setup
cleverr version
```

Run a command from source with `node bin/clever.js <command>` (or `cleverr`). It uses your active profile against the production API, so commands act on your real account: see [Testing](docs/contributing/testing.md) before trying anything that writes, and to work with another account.

## Contributor guides

| Guide | Content |
|---|---|
| [Codebase map](docs/contributing/codebase-map.md) | Where things are and how a command reaches the API |
| [Creating a command](docs/contributing/commands.md) | `defineCommand`, options, arguments, Zod schemas, command groups, registration |
| [Code style](docs/contributing/code-style.md) | How we write code: ESM, JSDoc, native over dependencies |
| [Documentation generation](docs/contributing/docs-generation.md) | What `npm run docs` generates and what you can edit by hand |
| [API client](docs/contributing/api-client.md) | Calling the API, adding a missing endpoint, testing a local build of the client |
| [Code quality](docs/contributing/code-quality.md) | ESLint, Prettier, TypeScript, npm scripts, what the CI checks on every PR |
| [Testing](docs/contributing/testing.md) | Command tests, unit tests, running commands from source, testing without touching your account |
| [Issues, commits and pull requests](docs/contributing/issues-commits-and-prs.md) | Issue templates, Conventional Commits, PR process, preview builds |
| [Build, CI and release](docs/contributing/build-ci-and-release.md) | Workflows, release-please, build system, scripts of `scripts/`, distribution channels |
| [Architecture Decision Records](docs/adr/) | Why things are the way they are |

## Contribution workflow

`master` is the main branch and is protected.

1. Open an issue (or comment on an existing one) to discuss the change before writing code. It avoids duplicate work and checks that the change fits the project.
2. Create a branch from `master`, with a descriptive name.
3. Make your change. Start from the [codebase map](docs/contributing/codebase-map.md) and the guide matching your task.
4. Run `npm run validate`: it runs the CI checks (lint, format, types, generated docs, unit tests) except the command tests: also run those of the commands you changed with `node --test src/commands/<command>/*.command.test.ts`. `docs:check` calls the public Clever Cloud API, so it can fail because the API data changed, not because of your change.
5. Commit with [Conventional Commits](docs/contributing/issues-commits-and-prs.md): the scope is the command name, e.g. `fix(drain): ...`.
6. Open a pull request that follows the template and closes the issue (`Closes #N`). Keep the branch rebased on `master`, without `fixup!` or `squash!` commits.
7. For PRs opened from a branch of this repository, the CI publishes preview binaries so reviewers can try your change. PRs from forks get none: the publication needs secrets that GitHub doesn't expose to them.

By contributing, you agree that your contribution is licensed under the [Apache-2.0](LICENSE) license.

### Dependencies

We keep dependencies to a minimum:

- Only add a dependency when absolutely necessary, and discuss it in your issue or PR.
- Prefer native JavaScript. In particular, don't use `lodash` in new code: we plan to remove it (see [Code style](docs/contributing/code-style.md)).
- Keep the binaries small: they bundle every dependency (`@yao-pkg/pkg`), and each one is a maintenance burden.

## AI coding agents

If you work with an AI coding agent (Claude Code, Codex, Cursor, Copilot…), [AGENTS.md](AGENTS.md) is its entry point: the rules that must always hold, the gotchas of the repository, the scripts and CLI commands it may run. It routes to the contributor guides above when a task needs them.

When you change a convention described in the contributor guides, update `AGENTS.md` too. You remain responsible for what your agent produces: review the diff and run the affected commands yourself before opening a PR.

## Getting help

- [GitHub issues](https://github.com/CleverCloud/clever-tools/issues): bugs, feature requests and questions about clever-tools.
- [Clever Cloud support](https://console.clever-cloud.com/ticket-center-choice): problems specific to your account, applications or add-ons.
