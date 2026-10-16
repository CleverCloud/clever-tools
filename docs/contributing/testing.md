# Testing

## Unit tests

Unit tests use the [Node.js test runner](https://nodejs.org/api/test.html) (`node:test` and `node:assert`), with no extra dependency.
They are written in TypeScript, in a `*.test.ts` file next to the module they cover (`src/config/config.test.ts` covers `src/config/config.js`), and run directly by Node.js, without a build step.

```bash
npm test
```

`npm test` runs every `src/**/*.test.ts` file. It is part of `npm run validate`, and the CI runs it on every PR (see [code-quality.md](code-quality.md)).

**A unit test suite is being built:** only a few modules have tests so far. Work in progress will add many tests at once, so don't add tests to existing code on your own. A brand new standalone util or helper is the exception, a unit test is welcome there.

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

Commands behind a feature flag (`k8s`, `ng`, `operators`) are hidden until enabled with `clever features enable <flag>`. This writes to your experimental features file: point `EXPERIMENTAL_FEATURES_FILE` to a temporary file to test them without changing your setup.

### Testing a binary

To test the self-contained binaries rather than the source, use the preview builds attached to every PR, or build one locally with `scripts/preview.js build` (see [issues-commits-and-prs.md](issues-commits-and-prs.md)).
