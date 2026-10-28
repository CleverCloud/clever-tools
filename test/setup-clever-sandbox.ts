import { after, beforeEach } from 'node:test';
import { fileURLToPath } from 'node:url';
import { CLEVER_FILES, CleverFsMock } from './clever-fs-mock.ts';
import { runCli, type RunCliOptions, type RunCliResult } from './lib/cli/run-cli.ts';
import { EnvMock } from './lib/env/env-mock.ts';

const CLEVER_BIN = fileURLToPath(new URL('../bin/clever.js', import.meta.url));

export interface CleverSandbox {
  /**
   * Its temporary directory is the `HOME` and the default working directory of the CLI (see `fsMock.setCwd()`).
   * By convention, config files go in `config/` (see `CLEVER_FILES`), apps in `<app>/`.
   */
  fsMock: CleverFsMock;
  /** Env vars of the CLI, on top of the hermetic env. */
  envMock: EnvMock;
  /**
   * Run `bin/clever.js` in the cwd of `fsMock`, with `HOME` in its temporary directory, `API_HOST` and
   * `AUTH_BRIDGE_HOST` on two distinct closed ports (any API call fails the run), and the vars of `envMock`.
   */
  runClever: (args: string[], options?: Partial<Pick<RunCliOptions, 'timeout' | 'stdin'>>) => Promise<RunCliResult>;
}

/**
 * Set up `fsMock` and `envMock` for the current `describe`, reset before each test, and return a `runClever()`
 * wired to them.
 * Must be called directly in the body of a `describe`: `node:test` attaches `beforeEach` and `after`
 * to the suite that is active at call time.
 */
export function setupCleverSandbox(): CleverSandbox {
  const fsMock = new CleverFsMock();
  const envMock = new EnvMock();

  beforeEach(() => {
    fsMock.reset();
    // Hermetic env: hosts point at closed ports, the home directory and every config file live in the temporary
    // directory of `fsMock`, so the CLI cannot reach anything a test did not set up, nor leak state to the next run.
    const homeDir = fsMock.getPath();
    envMock.reset({
      HOME: homeDir,
      APPDATA: homeDir,
      // Two distinct ports, so an output or an error tells which host the CLI used.
      API_HOST: 'http://127.0.0.1:1',
      AUTH_BRIDGE_HOST: 'http://127.0.0.1:2',
      CONFIGURATION_FILE: fsMock.getPath(CLEVER_FILES.config),
      EXPERIMENTAL_FEATURES_FILE: fsMock.getPath(CLEVER_FILES.experimentalFeatures),
      IDS_CACHE_FILE: fsMock.getPath(CLEVER_FILES.idsCache),
      // git spawned by the CLI reads no system config. Its global config is the one of `HOME`, none by default.
      GIT_CONFIG_NOSYSTEM: '1',
      // Pins the default locale of Intl (e.g. `localeCompare()` sorts), otherwise ICU falls back to its root locale.
      LANG: 'en_US.UTF-8',
      NO_UPDATE_NOTIFIER: '1',
      NO_COLOR: '1',
    });
  });

  after(() => {
    fsMock.stop();
  });

  function runClever(args: string[], options: Partial<Pick<RunCliOptions, 'timeout' | 'stdin'>> = {}) {
    return runCli(process.execPath, [CLEVER_BIN, ...args], {
      ...options,
      env: envMock.toEnv(),
      cwd: fsMock.getCwd(),
    });
  }

  return {
    fsMock,
    envMock,
    runClever,
  };
}
