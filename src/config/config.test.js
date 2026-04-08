import assert from 'node:assert';
import { after, beforeEach, describe, it, mock } from 'node:test';

/**
 * Read a config value from either a plain object (original) or a reglage Config (.get()).
 * @param {Record<string, unknown>} cfg
 * @param {string} key
 */
function get(cfg, key) {
  return cfg[key];
}

/**
 * @param {Record<string, unknown> & { get?: (key: string) => unknown }} cfg
 * @returns {Array<import('./config.js').Profile>}
 */
function getProfiles(cfg) {
  return /** @type {any} */ (get(cfg, 'profiles'));
}

/** @type {unknown} */
let fakeConfigFileData;

// Save original env
const originalEnv = { ...process.env };

const CONFIG_KEYS = [
  'CONFIGURATION_FILE',
  'EXPERIMENTAL_FEATURES_FILE',
  'APP_CONFIGURATION_FILE',
  'API_HOST',
  'AUTH_BRIDGE_HOST',
  'SSH_GATEWAY',
  'OAUTH_CONSUMER_KEY',
  'OAUTH_CONSUMER_SECRET',
  'API_DOC_URL',
  'DOC_URL',
  'CONSOLE_URL',
  'CONSOLE_TOKEN_URL',
  'GOTO_URL',
  'token',
  'secret',
  'expirationDate',
  'CLEVER_TOKEN',
  'CLEVER_SECRET',
];

function cleanEnv() {
  for (const key of CONFIG_KEYS) {
    delete process.env[key];
  }
}

/** Counter to bust ESM module cache */
let importCounter = 0;

/**
 * Set up mocks for fs, then import a fresh config module.
 * Uses a query string to bust the ESM cache so each test gets a fresh evaluation.
 * @param {Record<string, string>} [envOverrides]
 */
async function loadFreshConfig(envOverrides = {}) {
  cleanEnv();
  Object.assign(process.env, envOverrides);

  mock.module('../lib/fs.js', {
    namedExports: {
      readJsonSync: () => fakeConfigFileData,
      readJson: async () => fakeConfigFileData,
      writeJson: async () => {},
    },
  });

  importCounter++;
  return import(`./config.js?v=${importCounter}`);
}

describe('config', () => {
  beforeEach(() => {
    fakeConfigFileData = null;
    mock.restoreAll();
  });

  after(() => {
    cleanEnv();
    for (const key of Object.keys(process.env)) {
      if (!(key in originalEnv)) {
        delete process.env[key];
      }
    }
    Object.assign(process.env, originalEnv);
    mock.restoreAll();
  });

  describe('defaults (no config file, no env overrides)', () => {
    it('should have default API_HOST', async () => {
      const { config } = await loadFreshConfig();
      assert.strictEqual(get(config, 'API_HOST'), 'https://api.clever-cloud.com');
    });

    it('should have default AUTH_BRIDGE_HOST', async () => {
      const { config } = await loadFreshConfig();
      assert.strictEqual(get(config, 'AUTH_BRIDGE_HOST'), 'https://api-bridge.clever-cloud.com');
    });

    it('should have default CONSOLE_URL', async () => {
      const { config } = await loadFreshConfig();
      assert.strictEqual(get(config, 'CONSOLE_URL'), 'https://console.clever-cloud.com');
    });

    it('should have default DOC_URL', async () => {
      const { config } = await loadFreshConfig();
      assert.strictEqual(get(config, 'DOC_URL'), 'https://www.clever.cloud/developers/doc');
    });

    it('should have default OAUTH_CONSUMER_KEY', async () => {
      const { config } = await loadFreshConfig();
      assert.strictEqual(get(config, 'OAUTH_CONSUMER_KEY'), 'T5nFjKeHH4AIlEveuGhB5S3xg8T19e');
    });

    it('should have default SSH_GATEWAY', async () => {
      const { config } = await loadFreshConfig();
      assert.strictEqual(get(config, 'SSH_GATEWAY'), 'ssh@sshgateway-clevercloud-customers.services.clever-cloud.com');
    });

    it('should have empty profiles', async () => {
      const { config } = await loadFreshConfig();
      assert.deepStrictEqual(get(config, 'profiles'), []);
    });

    it('should have undefined token and secret', async () => {
      const { config } = await loadFreshConfig();
      assert.strictEqual(get(config, 'token'), undefined);
      assert.strictEqual(get(config, 'secret'), undefined);
    });
  });

  describe('derived keys from CONSOLE_URL', () => {
    it('should derive CONSOLE_TOKEN_URL from default CONSOLE_URL', async () => {
      const { config } = await loadFreshConfig();
      assert.strictEqual(get(config, 'CONSOLE_TOKEN_URL'), 'https://console.clever-cloud.com/cli-oauth');
    });

    it('should derive GOTO_URL from default CONSOLE_URL', async () => {
      const { config } = await loadFreshConfig();
      assert.strictEqual(get(config, 'GOTO_URL'), 'https://console.clever-cloud.com/goto');
    });

    it('should derive from custom CONSOLE_URL env var', async () => {
      const { config } = await loadFreshConfig({ CONSOLE_URL: 'https://custom-console.example.com' });
      assert.strictEqual(get(config, 'CONSOLE_TOKEN_URL'), 'https://custom-console.example.com/cli-oauth');
      assert.strictEqual(get(config, 'GOTO_URL'), 'https://custom-console.example.com/goto');
    });
  });

  describe('env vars override defaults', () => {
    it('should override API_HOST from env', async () => {
      const { config } = await loadFreshConfig({ API_HOST: 'https://custom-api.example.com' });
      assert.strictEqual(get(config, 'API_HOST'), 'https://custom-api.example.com');
    });

    it('should override SSH_GATEWAY from env', async () => {
      const { config } = await loadFreshConfig({ SSH_GATEWAY: 'custom-gateway' });
      assert.strictEqual(get(config, 'SSH_GATEWAY'), 'custom-gateway');
    });
  });

  describe('baseConfig ignores profiles', () => {
    it('should not have profile token/secret even when config file has profiles', async () => {
      fakeConfigFileData = {
        version: 1,
        profiles: [{ alias: 'default', token: 'file-token', secret: 'file-secret' }],
      };
      const { baseConfig } = await loadFreshConfig();
      assert.strictEqual(get(baseConfig, 'token'), undefined);
      assert.strictEqual(get(baseConfig, 'secret'), undefined);
    });

    it('should use default API_HOST even when profile has override', async () => {
      fakeConfigFileData = {
        version: 1,
        profiles: [
          {
            alias: 'default',
            token: 'tok',
            secret: 'sec',
            overrides: { API_HOST: 'https://profile-api.example.com' },
          },
        ],
      };
      const { baseConfig } = await loadFreshConfig();
      assert.strictEqual(get(baseConfig, 'API_HOST'), 'https://api.clever-cloud.com');
    });
  });

  describe('config file with current format', () => {
    it('should load token and secret from the active profile', async () => {
      fakeConfigFileData = {
        version: 1,
        profiles: [{ alias: 'default', token: 'my-token', secret: 'my-secret' }],
      };
      const { config } = await loadFreshConfig();
      assert.strictEqual(get(config, 'token'), 'my-token');
      assert.strictEqual(get(config, 'secret'), 'my-secret');
    });

    it('should load all profiles', async () => {
      fakeConfigFileData = {
        version: 1,
        profiles: [
          { alias: 'prod', token: 'tok1', secret: 'sec1' },
          { alias: 'staging', token: 'tok2', secret: 'sec2' },
        ],
      };
      const { config } = await loadFreshConfig();
      const profiles = getProfiles(config);
      assert.strictEqual(profiles.length, 2);
      assert.strictEqual(profiles[0].alias, 'prod');
      assert.strictEqual(profiles[1].alias, 'staging');
    });

    it('should apply active profile overrides', async () => {
      fakeConfigFileData = {
        version: 1,
        profiles: [
          {
            alias: 'custom',
            token: 'tok',
            secret: 'sec',
            overrides: { API_HOST: 'https://custom-api.example.com' },
          },
        ],
      };
      const { config } = await loadFreshConfig();
      assert.strictEqual(get(config, 'API_HOST'), 'https://custom-api.example.com');
    });
  });

  describe('legacy config file format', () => {
    it('should auto-convert legacy format to profile', async () => {
      fakeConfigFileData = {
        token: 'legacy-token',
        secret: 'legacy-secret',
        expirationDate: '2030-01-01',
      };
      const { config } = await loadFreshConfig();
      assert.strictEqual(get(config, 'token'), 'legacy-token');
      assert.strictEqual(get(config, 'secret'), 'legacy-secret');
      const profiles = getProfiles(config);
      assert.strictEqual(profiles.length, 1);
      assert.strictEqual(profiles[0].alias, 'default');
    });
  });

  describe('CLEVER_TOKEN / CLEVER_SECRET env vars', () => {
    it('should inject a virtual $env profile as the active one', async () => {
      const { config } = await loadFreshConfig({ CLEVER_TOKEN: 'env-token', CLEVER_SECRET: 'env-secret' });
      assert.strictEqual(get(config, 'token'), 'env-token');
      assert.strictEqual(get(config, 'secret'), 'env-secret');
      const profiles = getProfiles(config);
      assert.strictEqual(profiles[0].alias, '$env');
    });

    it('should prepend $env profile before file profiles', async () => {
      fakeConfigFileData = {
        version: 1,
        profiles: [{ alias: 'existing', token: 'tok', secret: 'sec' }],
      };
      const { config } = await loadFreshConfig({ CLEVER_TOKEN: 'env-token', CLEVER_SECRET: 'env-secret' });
      const profiles = getProfiles(config);
      assert.strictEqual(profiles.length, 2);
      assert.strictEqual(profiles[0].alias, '$env');
      assert.strictEqual(profiles[1].alias, 'existing');
    });

    it('should not inject $env when only CLEVER_TOKEN is set', async () => {
      const { config } = await loadFreshConfig({ CLEVER_TOKEN: 'env-token' });
      assert.deepStrictEqual(get(config, 'profiles'), []);
    });
  });

  describe('source priority: env > profile overrides > profile > defaults', () => {
    it('env vars should override profile overrides', async () => {
      fakeConfigFileData = {
        version: 1,
        profiles: [
          {
            alias: 'default',
            token: 'tok',
            secret: 'sec',
            overrides: { API_HOST: 'https://profile-api.example.com' },
          },
        ],
      };
      const { config } = await loadFreshConfig({ API_HOST: 'https://env-api.example.com' });
      assert.strictEqual(get(config, 'API_HOST'), 'https://env-api.example.com');
    });

    it('profile overrides should override defaults', async () => {
      fakeConfigFileData = {
        version: 1,
        profiles: [
          {
            alias: 'default',
            token: 'tok',
            secret: 'sec',
            overrides: { API_HOST: 'https://profile-api.example.com' },
          },
        ],
      };
      const { config } = await loadFreshConfig();
      assert.strictEqual(get(config, 'API_HOST'), 'https://profile-api.example.com');
    });
  });

  describe('reloadConfig', () => {
    it('should reflect config file changes after reload', async () => {
      fakeConfigFileData = {
        version: 1,
        profiles: [{ alias: 'initial', token: 'tok1', secret: 'sec1' }],
      };
      const mod = await loadFreshConfig();

      assert.strictEqual(get(mod.config, 'token'), 'tok1');

      // Simulate config file change
      fakeConfigFileData = {
        version: 1,
        profiles: [{ alias: 'updated', token: 'tok2', secret: 'sec2' }],
      };

      mod.reloadConfig();

      assert.strictEqual(get(mod.config, 'token'), 'tok2');
      const profiles = getProfiles(mod.config);
      assert.strictEqual(profiles[0].alias, 'updated');
    });
  });
});
