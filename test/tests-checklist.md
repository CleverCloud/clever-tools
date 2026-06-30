# Test checklist for `*.command.test.js`

When you write or update a `*.command.test.js`, every rule in §1, §2, §4, §5, §6 applies. Rules in §3 only apply to commands with the matching capability — read the command's source first to know which sub-sections kick in.

References use repo-relative paths and line ranges. Open them to copy the exact pattern.

## 1. File skeleton

- Before writing anything, look for an existing `*.command.test.js` covering a related command (same capability surface — writes files, streams logs, resolves an addon, interactive command, etc.) and use it as a template. The conventions below are easier to apply by pattern-matching than from scratch.
- One top-level `describe` per command, many `it` closures inside it. Sub-`describe` blocks are fine for grouping (e.g. ID resolution variants).
- Use the standard hooks wiring: `cliHooks()` + `before` / `beforeEach` / `after` — see `src/commands/database/database.backups.download.command.test.js:47-61`.

## 2. Coverage — always

- Test **all** combinations of options and args, including aliases and the case where the option is omitted — see `src/commands/database/database.backups.download.command.test.js:63-161` (`--output`, `--out`, no flag).
- Test invalid options — see `src/commands/ssh/ssh.command.test.js:56-65`.
- Test invalid args — see `src/commands/database/database.backups.download.command.test.js:228-239`.
- Test invalid combinations of options and args (e.g. mutually exclusive flags) — see `src/commands/ssh/ssh.command.test.js:56-65`.
- Test a non-2xx response for **every** API endpoint the command calls — see `src/commands/database/database.backups.download.command.test.js:201-226`.
- When the API returns a collection, test the empty-collection case — see `src/commands/database/database.backups.download.command.test.js:187-199`.
- Test the no-auth-state case (no profile configured): seed nothing with `.withConfigFile(...)` and assert the command errors. The `withConfigFile` mock is at `test/cli-hooks.js:91-94`.
- When env vars change command behavior, cover that with a custom `env` block on `thenRunCli` — see `src/commands/ssh/ssh.command.test.js:174-179` (`realSshEnv()`).

## 3. Coverage — gated on command capability

### Commands using `AppConfiguration.addLinkedApplication`

Reference for all five rules: `src/commands/ssh/ssh.command.test.js:67-106`.

- Not in an app directory (no `.withAppConfigFile(...)`) → command errors.
- App config has multiple aliases and no `--alias` is given → command errors and lists available aliases.
- App config has multiple aliases and an unknown `--alias` is given → command errors.
- App config has multiple aliases and an existing `--alias` is given → command succeeds.
- App config has a single alias (no `--alias` needed) → command succeeds.

### Commands resolving an org / app / addon ID

Canonical reference: `src/commands/database/database.backups.download.command.test.js:270-426`.

- For each ID kind the command accepts (orga id / orga name, app id / app name, addon id / addon real id / addon name), test the cache-hit path (with `.withIdsCacheFile(...)`, no `/v2/summary` call expected) and the cache-miss path (no cache file, `/v2/summary` is called).
- Test an unknown ID that is in neither the cache nor `/v2/summary`.
- When both an org and an app/addon are passed, test the case where the app/addon exists but not inside that org.

### Commands that write files

- Assert file content with `.verifyFiles((fsRead) => { ... })` — see usage at `src/commands/database/database.backups.download.command.test.js:99-129` and the `FileSystemRead` API surface (`readAppFile`, `readAppFileAsObject`, `readAppConfigFile`, `readConfigFile`, `readExperimentalFeaturesFile`, `readIdsCacheFile`) at `test/cli-hooks.js:241-326`.

### Commands streaming logs / SSE

- Use the `events` + `delayBetween` + final `{ type: 'close' }` pattern — see `src/commands/logs/logs.command.test.js:35-72`.

### Interactive commands (prompts)

- For raw-mode select / checkbox prompts (arrow keys), enable PTY mode and drive it with keypress sequences from `test/keys.js`: `thenRunCli([...], { pty: true, interactions: [{ waitFor: /…/, send: keys.DOWN + keys.ENTER }] })` — see `src/commands/profile/profile.switch.command.test.js:41-67`. Under PTY, stdout and stderr are merged into `result.output`; assert against that, not `result.stdout`.
- For plain text / password prompts, skip PTY and just pass `interactions: [{ waitFor: /…/, send: 'value\n' }]` — see `src/commands/tokens/tokens.create.command.test.js:46-93`.
- Cover the non-interactive bypass path too (e.g. `--alias` skipping a select prompt) — see `src/commands/profile/profile.switch.command.test.js:88-102`.

## 4. Mocking API responses

- To know what fields a mock must include, read the command source for what it consumes; cross-reference https://github.com/CleverCloud/clever-client.js when needed.
- API field names are often snake_case. That's expected — disable the relevant eslint rule locally if it triggers on mock object literals.

## 5. Fixtures

- Shared fixtures live in `test/fixtures/`. Reuse what's there before defining new ones — see `test/fixtures/id.js` (IDs) and `test/fixtures/self.js` (SELF user).
- Promote a local constant to `test/fixtures/` as soon as a second test file needs it.
- When the shared shape needs per-test variation, promote it as a function that returns the fixture rather than a frozen constant — callers pass overrides (or get fresh IDs/timestamps) without copy-pasting.

## 6. Assertions and output

- Prefer `assert.strictEqual` over `assert.match` for `stdout` / `stderr` / file content. Use `match` only when the output is non-deterministic — see `src/commands/database/database.backups.download.command.test.js:95-96` and `:127-128`.
- Exception: invalid-option / invalid-arg cases print the full CLI help after the error, which is long and brittle. Use `assert.match` against the error message portion instead of `strictEqual` for those.
