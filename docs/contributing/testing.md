# Testing

Automated tests are run with the [Node.js test runner](https://nodejs.org/api/test.html) (`node:test` and `node:assert`). The fake API of the command tests runs on [doublure](https://www.npmjs.com/package/@clevercloud/doublure).
They are written in TypeScript and run directly by Node.js, without a build step, and they are typechecked like the rest of the code (see [code-quality.md](code-quality.md#type-checking)).

| Kind | Where | What |
|---|---|---|
| Command tests | `src/commands/<command>/<command>.command.test.ts` or `<command>.<sub>.command.test.ts`, next to the command file | Black box tests of one command or subcommand: they run `bin/clever.js` in a sandbox, against a fake API, see [Command tests](#command-tests) |
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

Command tests are black box tests: they run `bin/clever.js` in a separate process, in a hermetic sandbox, against a fake API. `src/commands/version/version.command.test.ts` is the smallest example, `src/commands/stop/stop.command.test.ts` the smallest one calling the API.

The sandbox points `API_HOST` at `apiMock`, started on a random port. A call no test mocked gets a 404 from it. `AUTH_BRIDGE_HOST` is a closed port (`http://127.0.0.1:2`): the root help prints it, so it stays fixed, and there is no fake auth bridge yet.

### Layout of `test/`

| Path | Content |
|---|---|
| `test/lib/` | Generic helpers, nothing specific to Clever: `runCli()`, `assertCliResult()`, the file system and env mocks, the file assertions (`assertFile()`, `assertJsonFile()`, `assertNoFile()`) and `assertApiCalls()` |
| `test/` (root) | Everything specific to the Clever CLI: `setupCleverSandbox()`, `CleverFsMock`, `assertCleverResult()` |
| `test/fixtures/` | Shared API payloads of the command tests, one file per entity, see [Fixtures](#fixtures) |

### Shape of a test

```ts
describe('clever stop', () => {
  const { apiMock, fsMock, runClever } = setupCleverSandbox();

  it('with the linked application, should stop the application and print the success message', async () => {
    fsMock.writeAppConfigFile('myapp', { apps: [LINKED_APP_NODE] });
    await apiMock.respond('DELETE', `/v2/organisations/${APP_NODE.ownerId}/applications/${APP_NODE.id}/instances`, 204);
    fsMock.setCwd('myapp');

    const result = await runClever(['stop']);

    assertCleverResult(result, { exitCode: 0, stdoutText: '✓ Application successfully stopped!' });
    assertApiCalls(await apiMock.getCalls(), [
      { method: 'DELETE', path: `/v2/organisations/${APP_NODE.ownerId}/applications/${APP_NODE.id}/instances` },
    ]);
  });
});

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

- One `setupCleverSandbox()` per file, at the top of the root `describe`. It returns `apiMock`, `fsMock`, `envMock` and `runClever()`. Every mock is reset before each test.
- Three blocks, Given / When / Then, separated by one blank line. No blank line inside a block.

### Naming tests

A test name uses `should` followed by an observable result: what is printed, the files written, the exit code. Never an implementation detail.

- The root `describe` is the command as the user types it: `clever features enable`.
- The second level is the category, by source of what the test varies:
  - `Happy path`: the command does what was asked, exit code 0, even when there is nothing to do (`with the application already as default, should leave .clever.json unchanged`).
  - `CLI errors`: arguments and options.
  - `Environment errors`: files (`.clever.json`, config), env vars, the terminal.
  - `HTTP errors`: the API answers an error (4xx, 5xx).
  - `Blocking API state`: the API answers fine (2xx), but the state it returns makes the command decline, with a non-zero exit code (no ongoing deployment to cancel, no application matching a name).

  The status of the mocked response decides between the last two: an application looked up in a list that does not hold it is `Blocking API state`, a `GET /…/{id}` answering 404 is `HTTP errors`.
- The condition always comes before `should`: `with no format, should print the human format`. A condition shared by several tests goes in a `describe('with …')`, a condition specific to one test is a prefix of its name.
- Tests that only differ by the output format end with `in human format` / `in json format`.

### Given

- Only flat calls: `apiMock.respond*()`, `fsMock.write*()`, `fsMock.setCwd()`, `envMock.set()`.
- Always in this order: `fsMock.write*()`, then `fsMock.setCwd()`, then `envMock.*()`, then `apiMock.respond*()`.
- Everything explicit: no default method or status.
- `apiMock.respond*()` takes positional values or a single object, same values in the same order. `delay` is in milliseconds before the response. `:name` in a path matches one segment.
- A mock that the test does not assert uses the exact path, IDs interpolated: a call with other IDs gets a 404 and fails the command, so the path checks the IDs. A mock whose calls the test asserts can use path placeholders (`/v2/organisations/:ownerId/applications/:appId/…`): it answers whatever the IDs, and the assertion checks the path that was called, or that there was no call.
- `fsMock` holds one temporary directory, the `HOME` and the default working directory of the CLI. By convention, config files go in `config/` (see `CLEVER_FILES`) and apps in `<app>/` (e.g. `myapp/.clever.json`). Use `fsMock.setCwd('myapp')` to run the CLI elsewhere, never an option of `runClever()`.
- Clever files go through the typed helpers when one exists (`fsMock.writeConfigFile()`, `fsMock.writeAppConfigFile(appDir, …)`, `fsMock.writeExperimentalFeaturesFile()`), invalid contents included: a helper also accepts a string or any object (unknown key, broken JSON), so there is no raw variant. Add one to `CleverFsMock` once a test needs another file.
- `envMock.set()` and `envMock.unset()` change the env vars of the CLI, on top of the hermetic env (`HOME`, `NO_COLOR`, `LANG`, `CLI_WIDTH` at 200 columns for the prompts, the API hosts on `apiMock`…).

### When

- One `await runClever([...])` per test, without env, cwd or expected exit code: those belong to the Given or the Then.
- stdin can be piped as a string: `runClever(args, { stdin: '...' })` (not a terminal).

### Then

- `assertCleverResult()` always states `exitCode`. An omitted output (`stdout*` or `stderr*`) must be empty.
- Prefer the exact text (`stdoutText`, `stdoutJson`) to a regex. Keep `stdoutMatch` for what is really unpredictable.
- Argument and option errors use `usageError`: only the error lines printed before the help are compared.
- Only assert the calls the command is about (the write it sends, the call it must not send), not every read it makes on the way: how it fetches what it needs is an implementation detail.
  - A read-only command does not assert its reads when the output already proves them: the exact path of the mocks checks the IDs.
  - A command that never calls the API asserts `assertApiCalls(await apiMock.getCalls(), [])` in every test.
  - Every failing test of a command that writes (CLI, environment, HTTP, blocking state) mocks the write and asserts it was not sent.
- `assertApiCalls()` lists every expected call, in order, `[]` included when no call is expected. An omitted `query` or `body` must be absent, `headers` are only checked when listed. Narrow the calls first with `calls.filter({ method, path })` to assert only some of them.
- `calls.filter({ method, path })` only keeps the calls answered by a mock: a call that no mock answered is left out. To check that a call was not sent, mock its path with placeholders first, then assert that the filtered calls are empty. Two private functions keep the pair readable, e.g. `mockDeleteInstances()` and `assertNoDeleteInstances()` sharing a `DELETE_INSTANCES_PATH` constant.
- Files: `assertJsonFile(path, value)` or `assertFile(path, text)` check a whole file, `assertNoFile(path)` checks that a file was not written. To check only a part, read it (`fsMock.read()`) and assert on the value.
- Assert the end state of a file only when the command can write it, unchanged included after an error. Leave alone the files it never touches (`.clever.json` for `clever status`, `ids-cache.json`).

### What to cover

- A command that targets an application gets one happy path with `--alias` (one of several linked applications) and one with `--app` (an application that is not linked), to check it passes them on. The resolution of the application itself (default application, ambiguous name, `--app` and `--alias` together, unknown alias) is shared by every command and is tested once, not in every command. Same for how an alias is matched (case, name instead of alias), done by `findApp()` for every command.
- A command that calls the API gets at least one `HTTP errors` test, with the error body of the real API: `{ id, message, type: 'error' }`.
- Responses the real API never produces (a `null` body, an object instead of a list, a missing field, lowercase enum values) are not tested: the CLI trusts the API contract, a defensive pass will come later. A value the `Raw*` type of a fixture refuses (`null` on a non-nullable field) is one of them. Same for a `.clever.json` edited by hand or invalid, which a schema validation of the file will cover.
- One test per branch of the code: two tests that only differ by a value going through the same branch are one too many, keep one. Exceptions: a bound (`1` and `20`), and options that each have their own wiring to the same parser. A human and json pair is kept only when the json output goes through its own branch.
- A surprising behaviour that is kept starts its test with a `// current behavior: ...` comment. A bug is never pinned: it is an `it.todo` with a `// blocked: bug, ...` comment.

### Sharing between tests

A test must read without scrolling up, nor knowing hidden setup.

- No `beforeEach` that sets up data.
- A Given of several lines can move to a private function inside the `describe`, called explicitly in each test. It only answers API mocks (no file written behind the test's back), has a one-line JSDoc saying what it answers, and takes the entities as parameters typed with the `Raw*` types of the fixtures (`mockGetApplications(owner, applications)`), never `unknown`, rather than one function per case.
- Users, organisations and applications given to `apiMock` come from `test/fixtures/` (see [Fixtures](#fixtures)), the test only spells out what it relies on, as a spread: `{ ...ORGANISATION_FOO, canPay: false }`. Other bodies (errors, small or one-off payloads) stay literal in the test.
- In expected values (printed text, JSON, file), write literally what the user reads and interpolate what designates an entity:
  - What the user reads (names, labels, formatting, order) stays literal: it is what the test checks, and a fixture change can't change both the input and the expectation unnoticed.
  - What designates an entity of the fixtures, its ID, is interpolated from its constant (`${ORGANISATION_FOO.id}`), in paths and expected values alike: the test checks which entity is used, not how its opaque value is spelled, and every entity having its own UUID, the wrong one still fails the test.

### Fixtures

`test/fixtures/` holds the API payloads shared by the command tests, one file per entity: `user.ts`, `organisation.ts`, `app.ts`, `flavor.ts`, `deployment.ts`, `instance.ts`, plus `summary.ts`. Add only what a test uses.

- **Fixtures look like the real API**: same keys, types, `null`s and ID formats as a real response of the endpoint they stand for (an instance ID is a bare UUID, a deployment `id` a number and its `uuid` a `deployment_<uuid>`), only the values are made up. Check a new fixture against a real response (`clever curl`, GET only).
- **One constant per entity**, shaped like the response of its own endpoint (`USER_SELF` like `GET /v2/self`, `ORGANISATION_FOO` like `GET /v2/organisations/{id}`). An entity the API returns in several shapes holds every field of all of them (`INSTANCE_NODE_1`). Each entity is written in full, never as a spread of another one, so that two entities can't be confused. A spread only makes a variant of the same entity (`APP_NODE_SCALABLE`, or in a test `{ ...ORGANISATION_FOO, canPay: false }`).
- **A function only to keep an invariant or to project entities** onto an endpoint that lists them in another shape: `rawSummary()` for `GET /v2/summary`, `rawMembers()` for `GET /v2/organisations/{id}/members`, `rawInstances()` for `GET /v2/organisations/{id}/applications/{id}/instances` and `rawOrchestrationInstances()` for `GET /v4/orchestration/organisations/{id}/applications/{id}/instances`, which list the same instances (same UUIDs and names): v4 flags the build VM (`isBuildVm`) and also returns the deleted instances, v2 lists the build VM like any other instance. They take the constants and keep the fields of the endpoint. `rawSummary()` also keeps the invariant of the real API: the personal space shows up in `user`, with its resources, and first in `organisations`, without any. It is the only way to build a summary, and no test builds one without the personal space: never override `organisations` by hand to remove it, the real API always lists it.
- **A list only holds what the API would return in it**: `GET /v2/organisations/{id}/applications` only lists the applications of that owner (`[APP_NODE, APP_GO]` for `ORGANISATION_SELF`, `[APP_PHP, APP_JAVA]` for `ORGANISATION_FOO`).
- **Nullable fields are set to `null`, never removed**: an instance never deployed from a commit has `commit: null`, e.g. `{ ...INSTANCE_NODE_1, commit: null }`.
- **A relation is written in the test**: a role belongs to a user in an organisation, not to the user nor to the organisation, e.g. `rawMembers([{ user: USER_GIULIA, role: 'DEVELOPER' }])`.
- **Every entity has its own UUID**, `00000000-0000-4000-8000-000000000NNN`, so that an ID used in place of another one fails the test. The hundreds of `NNN` give the type: `1xx` users, `2xx` organisations, `3xx` applications, `4xx` deployments (their `uuid`), `5xx` instances. An ID that must match no entity (an unknown application) takes a free `NNN` in the range of its type (`app_...399`), never the one of a fixture.
- **Every shape has an exported `Raw*` type** (`RawApplication`, `RawInstance`, `RawSummary`…), for the parameters of the Given functions.
- **Applications are named after their runtime** (`APP_NODE`, `APP_GO`, `APP_PHP`, `APP_JAVA`, `APP_PYTHON`): a test that needs another runtime adds its own application, e.g. `APP_RUBY`.
- **An ID is taken from what it designates in the request**, even when two constants share its value:
  - the owner of an application in its path (`/v2/organisations/{owner}/applications/{app}`): `${APP_NODE.ownerId}`;
  - an organisation designated as such (the `organisations` commands, `--org`, `GET /v2/organisations/{id}`): `${ORGANISATION_SELF.id}`, `${ORGANISATION_FOO.id}`…;
  - a user or a member (`/v2/self`, members): `${USER_SELF.id}`.

The identity shared by all tests, to write literally in expected values:

| Constant | ID | Name |
|---|---|---|
| `USER_SELF` (current user) | `user_...100` | `Marie Dubois` (`marie.dubois@example.com`) |
| `USER_GIULIA`, `USER_LUKAS`, `USER_JAN` | `user_...101`, `102`, `103` | `Giulia Rossi`, `Lukas Schmidt`, `Jan Kowalski` |
| `ORGANISATION_SELF` (personal space of `USER_SELF`, distinct from the organisations they are a member of) | `user_...100` | `Marie Dubois` |
| `ORGANISATION_FOO`, `ORGANISATION_BAR` | `orga_...200`, `201` | `Foo Inc`, `Bar Inc` |
| `APP_NODE` (Node.js, owned by `USER_SELF`) | `app_...300` | `my-node-app`, alias `my-node-alias` |
| `APP_PHP` (PHP, owned by `Foo Inc`) | `app_...301` | `my-php-app`, alias `my-php-alias` |
| `APP_PYTHON` (Python, owned by `Bar Inc`, zone `rbx`) | `app_...302` | `my-python-app` |
| `APP_GO` (Go, owned by `USER_SELF`) | `app_...303` | `my-go-app` |
| `APP_JAVA` (Java + JAR, owned by `Foo Inc`) | `app_...304` | `my-java-app` |
| `DEPLOYMENT_NODE_OK`, `DEPLOYMENT_NODE_WIP` (of `APP_NODE`) | `id` `1`, `2`, `uuid` `deployment_...400`, `401` | |
| `INSTANCE_NODE_1`, `_2`, `_3`, `INSTANCE_NODE_BUILD` (build VM, `DEPLOYING`), `INSTANCE_NODE_DELETED` (`DELETED`, v4 history) (of `APP_NODE`) | `...500` to `504` | `Calm Fox`, `Bold Owl`, `Brave Lynx`, `Quiet Otter`, `Old Heron` |

```ts
await apiMock.respond(
  'GET',
  '/v2/summary',
  200,
  rawSummary({ organisations: [{ organisation: ORGANISATION_FOO, role: 'ADMIN' }] }),
);
await apiMock.respond(
  'GET',
  `/v2/organisations/${ORGANISATION_FOO.id}/members`,
  200,
  rawMembers([
    { user: USER_SELF, role: 'ADMIN' },
    { user: { ...USER_GIULIA, name: null }, role: 'DEVELOPER', job: 'CTO' },
  ]),
);
```

### Checking a test

- After writing a test, break the code under test (wrong text, missing branch), check the test fails with a readable message, then restore the code.

### Known pitfalls

- `stdoutText` is dedented, and `dedent` ignores the lines in column 0 when computing the common indentation: an interpolated text mixing lines in column 0 and indented lines loses the indentation of the latter.
- doublure does not match a static path holding a reserved character (`;,@&=+$`) once encoded (`/emails/a%40b.com`), and rejects such a mock: mock a templated path (`/v2/self/emails/:email`), set the decoded value in `pathParams` if needed, and check the exact encoded path with `assertApiCalls()`.
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
