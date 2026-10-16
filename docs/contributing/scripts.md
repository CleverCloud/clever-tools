# Scripts

This project provides a series of commands you can run as [npm scripts](https://docs.npmjs.com/cli/commands/npm-run-script), and Node.js scripts in `scripts/` used by the CI and the release workflow. Each script documents its usage in its header comment, and supports `--help`.

The scripts share code in `scripts/lib/` (`runCommand` for `--help` and error handling, the Cellar client, git, templates, terminal output…) and the package manager templates in `scripts/templates/`. A new script uses them instead of reimplementing the same things, and follows the header comment of the others (usage, arguments, environment variables, required system binaries, examples).

## npm scripts

| Script | What it does |
|---|---|
| `npm run lint` | Runs ESLint on the whole repository (see [code-quality.md](code-quality.md)). |
| `npm run lint:fix` | Runs ESLint and fixes what can be fixed automatically. |
| `npm run format` | Formats every file with Prettier (Markdown excluded). |
| `npm run format:check` | Checks the formatting without changing files. |
| `npm run typecheck` | Typechecks the files listed in the `include` of `tsconfig.json`. |
| `npm test` | Runs the unit tests (`src/**/*.test.ts`) with the Node.js test runner (see [testing.md](testing.md)). Modules are mocked with the native `node:test` mocks, still experimental, hence `--experimental-test-module-mocks`. |
| `npm run docs` | Regenerates the documentation from the command definitions (see [docs-generation.md](docs-generation.md)). Calls the public Clever Cloud API. |
| `npm run docs:check` | Checks that the generated documentation is up to date, without writing files. |
| `npm run validate` | Runs `lint`, `format:check`, `typecheck`, `docs:check` and `test`, like the CI. |
| `npm run fix-all` | Runs `lint:fix`, `docs` and `format`. |
| `npm run install-local:cliparse` | Packs `../cliparse-node` and installs it in place of the published `cliparse`. Rewrites `package.json`: undo it before committing. |

## Scripts in `scripts/`

### Development

| Script | What it does |
|---|---|
| `generate-docs.js [--check]` | Behind `npm run docs` and `npm run docs:check`. |
| `check-github-actions.js` | Lists the secrets and variables used by the workflows and compares them with what is configured on the repository. |
| `preview.js build [branch]` | Bundles, compiles and installs a preview binary locally. Slow, needs `tar` and `zip`. |
| `preview.js update [filter]` | Downloads or updates the published previews matching the filter, then offers to delete the local ones no longer published. The other `preview.js` subcommands are under Release. |

### Shell completion

Shipped in the npm package, run by users through the `install-clever-completion` and `uninstall-clever-completion` commands.

| Script | What it does |
|---|---|
| `install-autocomplete.sh` | Installs the bash and zsh completion scripts of `clever`. |
| `uninstall-autocomplete.sh` | Removes them. |

### Build

Run by the `build.yml` workflow, slow to run locally.

| Script | What it does | Environment variables |
|---|---|---|
| `bundle-cjs.js <version> <isPreview>` | Bundles the ESM source into a single CommonJS file with Rollup. | |
| `build-binary.js <version>` | Compiles the bundle into a native binary for the current platform with `@yao-pkg/pkg`. | |
| `create-archive.js <version> <createLatest>` | Packages the binary into a `.tar.gz` or `.zip` archive. | |
| `package-nfpm.js <version> <packager>` | Builds the RPM or DEB package with nfpm, GPG-signed. | `RPM_GPG_PRIVATE_KEY`, `RPM_GPG_PASSPHRASE` |

### Release

Run by the preview and release workflows. Most publish to shared Cellar buckets, package registries or GitHub, and need secrets: leave them to the CI. Running one by hand is only for exceptional cases, by a maintainer.

Environment variables are listed by name, the values are secrets or variables of the CI.

| Script | What it does | Environment variables |
|---|---|---|
| `resolve-since.js <version>` | Replaces `since: null` in command definitions by the upcoming version, on the release PR branch. | |
| `preview.js publish\|delete [branch]` | Publishes or deletes a PR preview on Cellar. | `CC_CLEVER_TOOLS_PREVIEWS_CELLAR_BUCKET`, `CC_CLEVER_TOOLS_PREVIEWS_CELLAR_KEY_ID`, `CC_CLEVER_TOOLS_PREVIEWS_CELLAR_SECRET_KEY` |
| `preview.js pr-comment [branch]` | Prints the PR comment with the download links of a preview, for `preview-publish.yml`. Only useful to the CI. | |
| `publish-cellar.js <version> <artifact>` | Uploads archives, RPM and DEB packages to Cellar. | `CC_CLEVER_TOOLS_RELEASES_CELLAR_BUCKET`, `CC_CLEVER_TOOLS_RELEASES_CELLAR_KEY_ID`, `CC_CLEVER_TOOLS_RELEASES_CELLAR_SECRET_KEY` |
| `publish-nexus.js <version> <packager>` | Uploads RPM and DEB packages to Nexus. | `NEXUS_USER`, `NEXUS_PASSWORD`, `NEXUS_RPM_REPOSITORY` or `NEXUS_DEB_REPOSITORY` |
| `update-github-release.js <version>` | Uploads the artifacts to the GitHub release. | `GITHUB_TOKEN` |
| `publish-aur.js <version> <flavor>` | Publishes the `clever-tools` and `clever-tools-bin` AUR packages (see [build-ci-and-release.md](build-ci-and-release.md)). | `AUR_GIT_URL` |
| `publish-homebrew.js <version>` | Updates the Homebrew tap formula. | `HOMEBREW_GIT_URL` |
| `publish-dockerhub.js <version>` | Builds and pushes the Docker images. | `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`, `DOCKER_IMAGE_NAME`, `DOCKERHUB_GIT_URL`, `CC_CLEVER_TOOLS_RELEASES_CELLAR_BUCKET` |
| `publish-exherbo.js <version>` | Adds the exheres package to the Exherbo repository. | `EXHERBO_GIT_URL` |
| `publish-winget.js <version>` | Submits the WinGet manifest. | `CI_TOKEN`, `CC_CLEVER_TOOLS_RELEASES_CELLAR_BUCKET`, `WINGET_PACKAGE_ID` |
