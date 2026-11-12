import { ApiMock } from '@clevercloud/doublure';
import { join } from 'node:path';
import { after, before, beforeEach } from 'node:test';
import { fileURLToPath } from 'node:url';
import { getCacheDir } from '../src/config/paths.js';
import { CLEVER_FILES, CleverFsMock } from './clever-fs-mock.ts';
import { runCli, type RunCliOptions, type RunCliResult } from './lib/cli/run-cli.ts';
import { EnvMock } from './lib/env/env-mock.ts';

const CLEVER_BIN = fileURLToPath(new URL('../bin/clever.js', import.meta.url));
const COMPILE_CACHE_DIR = getCompileCacheDir();

/**
 * The compile cache of the user, the one `bin/clever.js` fills when it runs outside the tests. It is resolved here,
 * from the real env, because the CLI runs with a temporary `HOME` and would otherwise start every test with a cold cache.
 */
function getCompileCacheDir(): string | undefined {
  try {
    return join(getCacheDir(), 'compile-cache');
  } catch {
    // No usable cache directory (HOME unset, for instance): the tests run without the compile cache
    return undefined;
  }
}

export interface CleverSandbox {
  /** Fake Clever Cloud API, the `API_HOST` of the CLI. */
  apiMock: ApiMock;
  /**
   * Its temporary directory is the `HOME` and the default working directory of the CLI (see `fsMock.setCwd()`).
   * By convention, config files go in `config/` (see `CLEVER_FILES`), apps in `<app>/`.
   */
  fsMock: CleverFsMock;
  /** Env vars of the CLI, on top of the hermetic env. */
  envMock: EnvMock;
  /**
   * Run `bin/clever.js` in the cwd of `fsMock`, with `HOME` in its temporary directory, `API_HOST` on `apiMock`,
   * `AUTH_BRIDGE_HOST` on a closed port, and the vars of `envMock`.
   */
  runClever: (args: string[], options?: Partial<Pick<RunCliOptions, 'timeout' | 'stdin'>>) => Promise<RunCliResult>;
}

/**
 * Set up the mocks for the current `describe`, reset before each test, and return a `runClever()` wired to them.
 * Must be called directly in the body of a `describe`: `node:test` attaches `before`, `beforeEach` and `after`
 * to the suite that is active at call time.
 */
export function setupCleverSandbox(): CleverSandbox {
  const apiMock = new ApiMock();
  const fsMock = new CleverFsMock();
  const envMock = new EnvMock();

  before(async () => {
    await apiMock.start();
  });

  beforeEach(async () => {
    fsMock.reset();
    await apiMock.reset();
    // Hermetic env: `API_HOST` points at the fake API, `AUTH_BRIDGE_HOST` at a closed port, the home directory and
    // every config file live in the temporary directory of `fsMock`, so the CLI cannot reach anything a test did not
    // set up, nor leak state to the next run.
    const homeDir = fsMock.getPath();
    envMock.reset({
      HOME: homeDir,
      APPDATA: homeDir,
      API_HOST: apiMock.getBaseUrl(),
      // The root help embeds this host: a fixed closed port keeps its text stable.
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
      // Node reuses the bytecode of the files it already compiled. It is outside the temporary directory of `fsMock`,
      // which is recreated before each test, so the following runs of the suite start with a warm cache.
      ...(COMPILE_CACHE_DIR != null ? { NODE_COMPILE_CACHE: COMPILE_CACHE_DIR } : {}),
    });
  });

  after(async () => {
    await apiMock.stop();
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
    apiMock,
    fsMock,
    envMock,
    runClever,
  };
}
