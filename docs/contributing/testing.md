# Testing

Automated tests are run with the [Node.js test runner](https://nodejs.org/api/test.html) (`node:test` and `node:assert`), with no extra dependency.
They are written in TypeScript and run directly by Node.js, without a build step, and they are typechecked like the rest of the code (see [code-quality.md](code-quality.md#type-checking)).

| Kind | Where | What |
|---|---|---|
| Command tests | `src/commands/<command>/<command>.command.test.ts` or `<command>.<sub>.command.test.ts`, next to the command file | Black box tests of one command or subcommand: they run `bin/clever.js` in a sandbox, see [Command tests](#command-tests) |
| Unit tests | `*.test.ts` next to the module they cover (`src/config/config.test.ts` covers `src/config/config.js`) | One module imported and called directly, see [Unit tests](#unit-tests) |
| Framework tests | `test/**/*.test.ts` next to the helper they cover | The test framework itself |

## Running the tests

```bash
npm run test:unit                          # unit and framework tests, a few seconds
npm run test:commands                      # command tests
npm test                                   # both
node --test src/commands/version/*.command.test.ts
```

`npm run validate` only runs `test:unit`: the command tests spawn the CLI for every test, which makes the whole suite slow to run after each change. Run the tests of the commands you changed instead (last line above). The CI runs `npm test` on every PR (see [code-quality.md](code-quality.md)).

**A unit test suite is being built:** only a few modules have unit tests so far. Work in progress will add many tests at once, so don't add unit tests to existing code on your own. A brand new standalone util or helper is the exception, a unit test is welcome there.

## Command tests

Command tests are black box tests: they run `bin/clever.js` in a separate process, in a hermetic sandbox. `src/commands/version/version.command.test.ts` is the smallest example.

The sandbox points `API_HOST` and `AUTH_BRIDGE_HOST` at two distinct closed ports (`http://127.0.0.1:1` and `http://127.0.0.1:2`, so an output tells which host was used): there is no fake API yet, so only commands that make no API call can be tested, and an unexpected call fails the run.

### Layout of `test/`

| Path | Content |
|---|---|
| `test/lib/` | Generic helpers, nothing specific to Clever: `runCli()`, `assertCliResult()`, the file system and env mocks, and the file assertions (`assertFile()`, `assertJsonFile()`, `assertNoFile()`) |
| `test/` (root) | Everything specific to the Clever CLI: `setupCleverSandbox()`, `CleverFsMock`, `assertCleverResult()` |

### Shape of a test

```ts
describe('clever features', () => {
  const { fsMock, runClever } = setupCleverSandbox();

  it('should list the features with their defaults in human format', async () => {
    fsMock.writeExperimentalFeaturesFile({ k8s: true });

    const result = await runClever(['features']);

    assertCleverResult(result, { exitCode: 0, stdoutText: `ID  STATUS  DESCRIPTION  ENABLED …` });
    assertJsonFile(fsMock.experimentalFeaturesFilePath(), { k8s: true });
  });
});
```

- One `setupCleverSandbox()` per file, at the top of the root `describe`. It returns `fsMock`, `envMock` and `runClever()`. `fsMock` and `envMock` are reset before each test.
- Three blocks, Given / When / Then, separated by one blank line. No blank line inside a block.

### Naming tests

A test name uses `should` followed by an observable result: what is printed, the files written, the exit code. Never an implementation detail.

- The root `describe` is the command as the user types it: `clever features enable`.
- The second level is the category: `Happy path`, `CLI errors` (arguments and options), `Environment errors` (files, env vars).
- The condition always comes before `should`: `with no format, should print the human format`. A condition shared by several tests goes in a `describe('with …')`, a condition specific to one test is a prefix of its name.
- Tests that only differ by the output format end with `in human format` / `in json format`.

### Given

- Only flat calls: `fsMock.write*()`, `fsMock.setCwd()`, `envMock.set()`.
- `fsMock` holds one temporary directory, the `HOME` and the default working directory of the CLI. By convention, config files go in `config/` (see `CLEVER_FILES`) and apps in `<app>/` (e.g. `myapp/.clever.json`). Use `fsMock.setCwd('myapp')` to run the CLI elsewhere, never an option of `runClever()`.
- Clever files go through the typed helpers when one exists (`fsMock.writeConfigFile()`, `fsMock.writeAppConfigFile(appDir, …)`, `fsMock.writeExperimentalFeaturesFile()`), invalid contents included: a helper also accepts a string or any object (unknown key, broken JSON), so there is no raw variant. Add one to `CleverFsMock` once a test needs another file.
- `envMock.set()` and `envMock.unset()` change the env vars of the CLI, on top of the hermetic env (`HOME`, `NO_COLOR`, `LANG`, the closed API hosts…).

### When

- One `await runClever([...])` per test, without env, cwd or expected exit code: those belong to the Given or the Then.
- stdin can be piped as a string: `runClever(args, { stdin: '...' })` (not a terminal).

### Then

- `assertCleverResult()` always states `exitCode`. An omitted output (`stdout*` or `stderr*`) must be empty.
- Prefer the exact text (`stdoutText`, `stdoutJson`) to a regex. Keep `stdoutMatch` for what is really unpredictable.
- Argument and option errors use `usageError`: only the error lines printed before the help are compared.
- Files: `assertJsonFile(path, value)` or `assertFile(path, text)` check a whole file, `assertNoFile(path)` checks that a file was not written. To check only a part, read it (`fsMock.read()`) and assert on the value.

### Sharing between tests

A test must read without scrolling up, nor knowing hidden setup.

- No `beforeEach` that sets up data.
- A Given of several lines can move to a private function inside the `describe`, called explicitly in each test.
- Values are written literally in the test that uses them, an expected value always stays literal in the test that checks it.

### Checking a test

- After writing a test, break the code under test (wrong text, missing branch), check the test fails with a readable message, then restore the code.

### Known pitfalls

- `stdoutText` is dedented, and `dedent` ignores the lines in column 0 when computing the common indentation: an interpolated text mixing lines in column 0 and indented lines loses the indentation of the latter.
- A crash of the CLI only shows its message, not its stack trace (it needs `CLEVER_VERBOSE`, which also prints debug lines on stdout).
- Windows is not handled yet: the env is hermetic, so the CLI lacks the OS vars it needs there (`SystemRoot`, `windir`, `TEMP`, `TMP`, `PATH`, `PATHEXT`, `COMSPEC`).

## Unit tests

A unit test imports a module and calls it directly, with no sandbox: keep them for standalone utils and helpers, a command is covered by its command tests.
They live in a `*.test.ts` file next to the module they cover (`src/config/config.test.ts` covers `src/config/config.js`). Test names follow the same rules as command tests (see [Naming tests](#naming-tests)). Modules are mocked with the native `node:test` mocks, see `src/config/config.test.ts`.

## Manual testing

Most behaviour changes are still verified by running the affected command from source.

### Running a command from source

```bash
# Run from source (no build needed)
node bin/clever.js my-command --help
node bin/clever.js my-command arg1 --option value

# Check argument/option validation
node bin/clever.js my-command                       # Should error on missing required arg
node bin/clever.js my-command arg --format invalid  # Schema validation error
```

Add `-v` (or `CLEVER_VERBOSE=1`) to see the API calls. For a step-by-step debugger, run `node --inspect-brk bin/clever.js <command>` and attach your IDE or Chrome DevTools.

### Testing without touching your real account

Running from source uses the active profile of your machine against the production API: the commands act on that account. Start with read-only commands.

clever-tools supports several profiles. Keep one for testing, tied to an account that holds nothing you care about, and switch to it before trying anything that writes:

```bash
clever login --alias test    # add the profile, once
clever profile list          # the profiles, the active one is marked [active]
clever profile switch --alias test
clever profile               # the active profile: check it before running a command
```

The profiles live in the configuration file, shared by every terminal: `profile switch` changes the active profile everywhere, so switch back afterwards. Check the active profile with `clever profile` before running a command that writes.

To use a test account in one terminal only, without touching the others, point `CONFIGURATION_FILE` to a separate file and log in with it:

```bash
export CONFIGURATION_FILE=/tmp/clever-test.json
node bin/clever.js login
```

Commands behind a feature flag (`k8s`, `ng`, `operators`) are hidden until enabled with `clever features enable <flag>`. This writes to your experimental features file: point `EXPERIMENTAL_FEATURES_FILE` to a temporary file to test them without changing your setup.

### Testing a binary

To test the self-contained binaries rather than the source, use the preview builds attached to PRs opened from a branch of this repository, or build one locally with `scripts/preview.js build` (see [issues-commits-and-prs.md](issues-commits-and-prs.md)).
