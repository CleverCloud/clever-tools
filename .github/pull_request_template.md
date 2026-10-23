<!-- Every PR addresses an existing issue. Remove the sections that don't apply. -->

Closes #

## TL;DR

<!-- 200-250 characters: the problem and what this PR changes, in plain prose. -->

## Context

<!-- Only if background is needed to understand the problem: the situation today, in 1-2 sentences. -->

## Problem

<!-- What is wrong or missing. For a bug: what goes wrong today. For a feature: what users cannot do, or what is painful. -->

## Proposal

<!-- The approach and the technical choices. The diff shows the what, explain the why. -->

### Breaking changes

<!-- If a command, option, output format or exit code changes for existing users. Flag the commit too (`feat(env)!: ...` or a `BREAKING CHANGE:` footer), release-please needs it to bump the major version. -->

### Design decisions

<!-- Non-obvious choices worth reviewing: naming of commands and options, output format, alternatives you dropped. -->

## How to review

<!-- For large PRs: suggested order, key files. -->

## How to test

<!-- Commands to run with `node bin/clever.js`, with the expected output: before/after for a bug, main use cases and edge cases for a feature. -->

1.
2.

## Out of scope

<!-- What this PR deliberately does not do. -->

<!--
Before requesting a review:
- The PR stays focused on the linked issue
- `npm run validate` passes
- For CLI behaviour changes, the affected commands were run with `node bin/clever.js`
- Commits follow Conventional Commits, without fixup!/squash! commits, rebased on master
- If a command changed: `npm run docs` was run and generated files are committed
- If a behaviour changed: the user guides (`docs/*.md`) and the custom sections of `<command>.docs.md` that describe it are up to date
- If a command was added: it uses `since: null`
- If a command was added, removed or its usage changed: `skills/clever-tools/SKILL.md` is up to date
-->
