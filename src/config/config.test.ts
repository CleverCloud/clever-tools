import assert from 'node:assert';
import { afterEach, beforeEach, describe, it, mock } from 'node:test';

const { setup, mockConfigFile, mockEnv, importFreshConfig } = (() => {
  // `xdg` needs HOME to resolve default paths
  const HOME = process.env.HOME;
  let fakeConfigFile: unknown;
  let fakeEnv: Record<string, string | undefined>;
  let importCounter = 0;

  return {
    /** Install the fs and env mocks with a blank state, to call before each test. */
    setup: () => {
      fakeConfigFile = null;
      fakeEnv = { HOME };
      mock.property(process, 'env', fakeEnv);
      mock.module('../lib/fs.js', {
        namedExports: {
          readJsonSync: () => fakeConfigFile,
          readJson: async () => fakeConfigFile,
          writeJson: async () => {},
        },
      });
    },

    mockConfigFile: (data: unknown) => {
      fakeConfigFile = data;
    },

    mockEnv: (env: Record<string, string>) => {
      Object.assign(fakeEnv, env);
    },

    importFreshConfig: (): Promise<typeof import('./config.js')> => {
      // `config.js` reads `process.env` and the config file when it is evaluated, and ESM evaluates a module only once per URL.
      // The mocks only affect imports made after them, so a cached `config.js` would keep the previous env and file data.
      // A unique query string forces a fresh evaluation, so each test gets a `config` built from its own env and file data.
      importCounter++;
      return import(`./config.js?v=${importCounter}`);
    },
  };
})();

describe('config', () => {
  beforeEach(() => setup());
  afterEach(() => mock.restoreAll());

  describe('defaults (no config file, no env overrides)', () => {
    it('should have default API_HOST', async () => {
      const { config } = await importFreshConfig();
      assert.strictEqual(config.get('API_HOST'), 'https://api.clever-cloud.com');
    });

    it('should have default AUTH_BRIDGE_HOST', async () => {
      const { config } = await importFreshConfig();
      assert.strictEqual(config.get('AUTH_BRIDGE_HOST'), 'https://api-bridge.clever-cloud.com');
    });

    it('should have default CONSOLE_URL', async () => {
      const { config } = await importFreshConfig();
      assert.strictEqual(config.get('CONSOLE_URL'), 'https://console.clever-cloud.com');
    });

    it('should have default DOC_URL', async () => {
      const { config } = await importFreshConfig();
      assert.strictEqual(config.get('DOC_URL'), 'https://www.clever.cloud/developers/doc');
    });

    it('should have default OAUTH_CONSUMER_KEY', async () => {
      const { config } = await importFreshConfig();
      assert.strictEqual(config.get('OAUTH_CONSUMER_KEY'), 'T5nFjKeHH4AIlEveuGhB5S3xg8T19e');
    });

    it('should have default SSH_GATEWAY', async () => {
      const { config } = await importFreshConfig();
      assert.strictEqual(config.get('SSH_GATEWAY'), 'ssh@sshgateway-clevercloud-customers.services.clever-cloud.com');
    });
  });

  describe('derived keys from CONSOLE_URL', () => {
    it('should derive CONSOLE_TOKEN_URL from default CONSOLE_URL', async () => {
      const { config } = await importFreshConfig();
      assert.strictEqual(config.get('CONSOLE_TOKEN_URL'), 'https://console.clever-cloud.com/cli-oauth');
    });

    it('should derive GOTO_URL from default CONSOLE_URL', async () => {
      const { config } = await importFreshConfig();
      assert.strictEqual(config.get('GOTO_URL'), 'https://console.clever-cloud.com/goto');
    });

    it('should derive from custom CONSOLE_URL env var', async () => {
      mockEnv({ CONSOLE_URL: 'https://custom-console.example.com' });
      const { config } = await importFreshConfig();
      assert.strictEqual(config.get('CONSOLE_TOKEN_URL'), 'https://custom-console.example.com/cli-oauth');
      assert.strictEqual(config.get('GOTO_URL'), 'https://custom-console.example.com/goto');
    });

    it('should not derive CONSOLE_TOKEN_URL when not null', async () => {
      mockEnv({ CONSOLE_TOKEN_URL: 'https://token.example.com' });
      const { config } = await importFreshConfig();
      assert.strictEqual(config.get('CONSOLE_TOKEN_URL'), 'https://token.example.com');
    });

    it('should not derive GOTO_URL when not null', async () => {
      mockEnv({ GOTO_URL: 'https://goto.example.com' });
      const { config } = await importFreshConfig();
      assert.strictEqual(config.get('GOTO_URL'), 'https://goto.example.com');
    });
  });

  describe('env vars override defaults', () => {
    it('should override API_HOST from env', async () => {
      mockEnv({ API_HOST: 'https://custom-api.example.com' });
      const { config } = await importFreshConfig();
      assert.strictEqual(config.get('API_HOST'), 'https://custom-api.example.com');
    });

    it('should override SSH_GATEWAY from env', async () => {
      mockEnv({ SSH_GATEWAY: 'custom-gateway' });
      const { config } = await importFreshConfig();
      assert.strictEqual(config.get('SSH_GATEWAY'), 'custom-gateway');
    });
  });

  describe('baseConfig ignores profiles', () => {
    it('should use default API_HOST even when profile has override', async () => {
      mockConfigFile({
        version: 1,
        profiles: [
          {
            alias: 'default',
            token: 'tok',
            secret: 'sec',
            overrides: { API_HOST: 'https://profile-api.example.com' },
          },
        ],
      });
      const { baseConfig } = await importFreshConfig();
      assert.strictEqual(baseConfig.get('API_HOST'), 'https://api.clever-cloud.com');
    });
  });

  describe('config file with current format', () => {
    it('should load all profiles', async () => {
      mockConfigFile({
        version: 1,
        profiles: [
          { alias: 'prod', token: 'tok1', secret: 'sec1' },
          { alias: 'staging', token: 'tok2', secret: 'sec2' },
        ],
      });
      const { config } = await importFreshConfig();
      const profiles = config.profiles;
      assert.strictEqual(profiles.length, 2);
      assert.strictEqual(profiles[0].alias, 'prod');
      assert.strictEqual(profiles[1].alias, 'staging');
    });

    it('should apply active profile overrides', async () => {
      mockConfigFile({
        version: 1,
        profiles: [
          {
            alias: 'custom',
            token: 'tok',
            secret: 'sec',
            overrides: { API_HOST: 'https://custom-api.example.com' },
          },
        ],
      });
      const { config } = await importFreshConfig();
      assert.strictEqual(config.get('API_HOST'), 'https://custom-api.example.com');
    });
  });

  describe('legacy config file format', () => {
    it('should auto-convert legacy format to profile', async () => {
      mockConfigFile({
        token: 'legacy-token',
        secret: 'legacy-secret',
        expirationDate: '2030-01-01',
      });
      const { config } = await importFreshConfig();
      const profiles = config.profiles;
      assert.strictEqual(profiles.length, 1);
      assert.strictEqual(profiles[0].token, 'legacy-token');
      assert.strictEqual(profiles[0].secret, 'legacy-secret');
      assert.strictEqual(profiles[0].alias, 'default');
    });
  });

  describe('CLEVER_TOKEN / CLEVER_SECRET env vars', () => {
    it('should inject a virtual $env profile as the active one', async () => {
      mockEnv({ CLEVER_TOKEN: 'env-token', CLEVER_SECRET: 'env-secret' });
      const { config } = await importFreshConfig();
      const profiles = config.profiles;
      assert.strictEqual(profiles[0].token, 'env-token');
      assert.strictEqual(profiles[0].secret, 'env-secret');
      assert.strictEqual(profiles[0].alias, '$env');
    });

    it('should prepend $env profile before file profiles', async () => {
      mockConfigFile({
        version: 1,
        profiles: [{ alias: 'existing', token: 'tok', secret: 'sec' }],
      });
      mockEnv({ CLEVER_TOKEN: 'env-token', CLEVER_SECRET: 'env-secret' });
      const { config } = await importFreshConfig();
      const profiles = config.profiles;
      assert.strictEqual(profiles.length, 2);
      assert.strictEqual(profiles[0].alias, '$env');
      assert.strictEqual(profiles[1].alias, 'existing');
    });

    it('should not inject $env when only CLEVER_TOKEN is set', async () => {
      mockEnv({ CLEVER_TOKEN: 'env-token' });
      const { config } = await importFreshConfig();
      assert.deepStrictEqual(config.profiles, []);
    });
  });

  describe('source priority: env > profile overrides > profile > defaults', () => {
    it('env vars should override profile overrides', async () => {
      mockConfigFile({
        version: 1,
        profiles: [
          {
            alias: 'default',
            token: 'tok',
            secret: 'sec',
            overrides: { API_HOST: 'https://profile-api.example.com' },
          },
        ],
      });
      mockEnv({ API_HOST: 'https://env-api.example.com' });
      const { config } = await importFreshConfig();
      assert.strictEqual(config.get('API_HOST'), 'https://env-api.example.com');
    });

    it('profile overrides should override defaults', async () => {
      mockConfigFile({
        version: 1,
        profiles: [
          {
            alias: 'default',
            token: 'tok',
            secret: 'sec',
            overrides: { API_HOST: 'https://profile-api.example.com' },
          },
        ],
      });
      const { config } = await importFreshConfig();
      assert.strictEqual(config.get('API_HOST'), 'https://profile-api.example.com');
    });
  });

  describe('reloadConfig', () => {
    it('should reflect config file changes after reload', async () => {
      mockConfigFile({
        version: 1,
        profiles: [
          {
            alias: 'initial',
            token: 'tok1',
            secret: 'sec1',
            overrides: { API_HOST: 'https://initial-api.example.com' },
          },
        ],
      });
      const mod = await importFreshConfig();

      assert.strictEqual(mod.config.activeProfile?.alias, 'initial');
      assert.strictEqual(mod.config.activeProfile?.token, 'tok1');
      assert.strictEqual(mod.config.activeProfile?.secret, 'sec1');
      assert.strictEqual(mod.config.get('API_HOST'), 'https://initial-api.example.com');

      // Simulate config file change
      mockConfigFile({
        version: 1,
        profiles: [
          {
            alias: 'updated',
            token: 'tok2',
            secret: 'sec2',
            overrides: { API_HOST: 'https://updated-api.example.com' },
          },
        ],
      });

      mod.reloadConfig();

      assert.strictEqual(mod.config.activeProfile?.alias, 'updated');
      assert.strictEqual(mod.config.activeProfile?.token, 'tok2');
      assert.strictEqual(mod.config.activeProfile?.secret, 'sec2');
      assert.strictEqual(mod.config.get('API_HOST'), 'https://updated-api.example.com');
    });
  });
});
