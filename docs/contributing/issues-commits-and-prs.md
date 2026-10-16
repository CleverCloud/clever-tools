# Issues, commits and pull requests

## Issues

Open an issue before a PR, from one of the [issue templates](../../.github/ISSUE_TEMPLATE/): **Bug report** (a command fails or behaves unexpectedly) or **Feature request** (a new command, option or behaviour). Search the existing issues first.

- Describe the problem, not the solution: the title says the need ("No way to list the drains of every app of an organisation"), not the fix ("Add `--all` to drain list"), and stays under 85 characters.
- Start with a short TL;DR (200 to 250 characters: context, problem and impact), then the problem with a concrete example.
- Put an idea of solution in "Solution considered", and what you ruled out, so the discussion starts from it.
- A problem specific to your account, applications or add-ons, where you may need to share private information, goes to [Clever Cloud support](https://console.clever-cloud.com/ticket-center-choice).

## Commits

Commit messages follow [Conventional Commits](https://www.conventionalcommits.org), checked by commitlint (`@commitlint/config-conventional`): locally by the `commit-msg` hook once `git config core.hooksPath '.githooks'` is set, and by the CI on every PR.

```
<type>(<scope>): <subject>

<body>

<footer>
```

The scope is the command name: `feat(env): add JSON output format`. For a change affecting several commands, split it into several commits when possible, otherwise omit the scope and explain in the body. For complex cases, see [release-please's multi-fix syntax](https://github.com/googleapis/release-please#what-if-my-pr-contains-multiple-fixes-or-features).

The CHANGELOG is built from the commit messages (see [build-ci-and-release.md](build-ci-and-release.md)), so the type and scope are the release note:

| Type | In the CHANGELOG |
|---|---|
| `feat` | 🚀 Features |
| `fix` | 🐛 Bug Fixes |
| `perf` | 💪 Performance Improvements |
| `revert` | ↩ Reverts |
| `docs`, `style`, `refactor`, `test`, `build`, `ci`, `chore` | Hidden |

The sections are configured in `.github/config/changelog-types.json`.

A breaking change (a command, option, output format or exit code that changes for existing users) is flagged in the commit, which is how release-please bumps the major version: add `!` after the type or scope (`feat(env)!: ...`), or a `BREAKING CHANGE: <what changes and how to migrate>` footer.

## Pull requests

- Every PR addresses an existing issue: open one first to discuss the change. Keep the PR limited to what the issue needs, unrelated fixes and refactors go in their own issue and PR.
- Fill in the [PR template](../../.github/pull_request_template.md): it references the issue (`Closes #N`) and ends with the checklist to go through before requesting a review.
- Mark the PR as draft while it is in progress.
- The branch must be rebased on the latest `master` and contain no `fixup!` / `squash!` commits: the CI rejects both (see [code-quality.md](code-quality.md)).
- PRs are reviewed by the Clever Cloud team.

## Preview builds

Every PR opened from a branch of this repository gets preview binaries for Linux and macOS, built by the `preview-publish.yml` workflow (PRs from forks get none, the publication needs secrets). Add the `build:win` label to include Windows. A comment on the PR links the downloads, and the preview is deleted when the PR is closed. PRs that only change Markdown files get no preview.

Locally, with `scripts/preview.js` (see [build-ci-and-release.md](build-ci-and-release.md#scripts)):

- `scripts/preview.js build` builds and installs a preview (slow, needs `tar`, or PowerShell on Windows).
- `scripts/preview.js update [filter]` downloads or updates every published preview matching the filter (all by default), then offers to delete the local ones that are no longer published.
- `publish`, `delete` and `pr-comment` are run by the CI. Running them by hand needs the admin Cellar credentials of the previews bucket, and is only for exceptional cases.
