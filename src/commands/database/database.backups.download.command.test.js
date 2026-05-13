/* eslint-disable camelcase */
// API fields below (backup_id, creation_date, download_url) are snake_case on purpose:
// they mirror the Clever Cloud API response shape and the eslint rule is disabled per
// the test-checklist's §4 guidance for mock object literals.

import * as assert from 'node:assert';
import { after, before, beforeEach, describe, it } from 'node:test';
import { cliHooks } from '../../../test/cli-hooks.js';
import { NOT_LOGGED_IN_ERROR } from '../../../test/fixtures/errors.js';
import { ADDON_ID, ORGA_ID, UUID } from '../../../test/fixtures/id.js';
import { idsCache } from '../../../test/fixtures/ids-cache.js';
import { SELF } from '../../../test/fixtures/self.js';

/**
 * @typedef {import('../../../test/cli-hooks.types.js').NewCliScenario} NewCliScenario
 */

const REAL_ADDON_ID = `postgresql_${UUID}`;
const BACKUP_ID = '11111111-1111-1111-1111-111111111111';
const OTHER_BACKUP_ID = '22222222-2222-2222-2222-222222222222';
const BACKUP_CONTENT = 'mock-backup-content';

const SUMMARY = {
  user: { ...SELF, applications: [], addons: [], consumers: [] },
  organisations: [
    {
      id: ORGA_ID,
      name: 'test-org',
      applications: [],
      addons: [{ id: ADDON_ID, realId: REAL_ADDON_ID, name: 'my-db', providerId: 'postgresql-addon' }],
      consumers: [],
    },
  ],
};

const ADDON_IDS_CACHE = idsCache({
  owners: {
    [ADDON_ID]: ORGA_ID,
    [REAL_ADDON_ID]: ORGA_ID,
  },
  addons: {
    [ADDON_ID]: { addonId: ADDON_ID, realId: REAL_ADDON_ID },
    [REAL_ADDON_ID]: { addonId: ADDON_ID, realId: REAL_ADDON_ID },
  },
});

const BACKUPS_ENDPOINT = '/v2/backups/:ownerId/:realAddonId';

/**
 * Build a single API-shaped backup entry. Use it as a fixture for /v2/backups response bodies.
 * @param {{ id?: string, date?: string, downloadUrl: string }} props
 */
function backupEntry({ id = BACKUP_ID, date = '2026-02-01T00:00:00Z', downloadUrl }) {
  return {
    backup_id: id,
    creation_date: date,
    status: 'COMPLETED',
    download_url: downloadUrl,
  };
}

describe('database backups download command', () => {
  const hooks = cliHooks();
  /** @type {NewCliScenario} */
  let newScenario;
  /** @type {string} */
  let apiHost;

  before(async () => {
    newScenario = await hooks.before();
    apiHost = newScenario.mockClient.baseUrl;
  });

  beforeEach(hooks.beforeEach);

  after(hooks.after);

  describe('happy path', () => {
    it('writes backup content to stdout when --output is omitted', async () => {
      const downloadPath = `/downloads/${BACKUP_ID}`;
      const result = await newScenario()
        .withIdsCacheFile(ADDON_IDS_CACHE)
        .when({ method: 'GET', path: BACKUPS_ENDPOINT })
        .respond({
          status: 200,
          body: [
            backupEntry({ id: OTHER_BACKUP_ID, date: '2026-01-01T00:00:00Z', downloadUrl: `${apiHost}/downloads/${OTHER_BACKUP_ID}` }),
            backupEntry({ downloadUrl: `${apiHost}${downloadPath}` }),
          ],
        })
        .when({ method: 'GET', path: downloadPath })
        .respond({ status: 200, body: BACKUP_CONTENT })
        .thenRunCli(['database', 'backups', 'download', ADDON_ID, BACKUP_ID])
        .verify((calls) => {
          assert.strictEqual(calls.count, 2);
          assert.strictEqual(calls.first.pathParams?.ownerId, ORGA_ID);
          assert.strictEqual(calls.first.pathParams?.realAddonId, REAL_ADDON_ID);
          assert.strictEqual(calls.last.path, downloadPath);
        });

      assert.strictEqual(result.stdout, BACKUP_CONTENT);
      assert.strictEqual(result.stderr, '');
    });

    it('writes backup content to a file when --output is provided', async () => {
      const downloadPath = `/downloads/${BACKUP_ID}`;
      const result = await newScenario()
        .withAppFile('placeholder', '')
        .withIdsCacheFile(ADDON_IDS_CACHE)
        .when({ method: 'GET', path: BACKUPS_ENDPOINT })
        .respond({ status: 200, body: [backupEntry({ downloadUrl: `${apiHost}${downloadPath}` })] })
        .when({ method: 'GET', path: downloadPath })
        .respond({ status: 200, body: BACKUP_CONTENT })
        .thenRunCli(['database', 'backups', 'download', ADDON_ID, BACKUP_ID, '--output', 'backup.dump'])
        .verify((calls) => {
          assert.strictEqual(calls.count, 2);
          assert.strictEqual(calls.last.path, downloadPath);
        })
        .verifyFiles((fsRead) => {
          assert.strictEqual(fsRead.readAppFile('backup.dump'), BACKUP_CONTENT);
        });

      assert.strictEqual(result.stdout, '');
      assert.strictEqual(result.stderr, '');
    });

    it('accepts --out as an alias for --output', async () => {
      const downloadPath = `/downloads/${BACKUP_ID}`;
      const result = await newScenario()
        .withAppFile('placeholder', '')
        .withIdsCacheFile(ADDON_IDS_CACHE)
        .when({ method: 'GET', path: BACKUPS_ENDPOINT })
        .respond({ status: 200, body: [backupEntry({ downloadUrl: `${apiHost}${downloadPath}` })] })
        .when({ method: 'GET', path: downloadPath })
        .respond({ status: 200, body: BACKUP_CONTENT })
        .thenRunCli(['database', 'backups', 'download', ADDON_ID, BACKUP_ID, '--out', 'backup.dump'])
        .verify((calls) => {
          assert.strictEqual(calls.count, 2);
          assert.strictEqual(calls.last.path, downloadPath);
        })
        .verifyFiles((fsRead) => {
          assert.strictEqual(fsRead.readAppFile('backup.dump'), BACKUP_CONTENT);
        });

      assert.strictEqual(result.stdout, '');
      assert.strictEqual(result.stderr, '');
    });
  });

  describe('arguments and options', () => {
    it('errors when no arguments are given', async () => {
      const result = await newScenario()
        .thenRunCli(['database', 'backups', 'download'], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 0);
        });

      assert.match(result.stdout, /missing value/);
    });

    it('errors when only the addon argument is given', async () => {
      const result = await newScenario()
        .thenRunCli(['database', 'backups', 'download', ADDON_ID], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 0);
        });

      assert.match(result.stdout, /backup-id: missing value/);
    });
  });

  describe('backup selection', () => {
    it('errors when no backup matches the given ID', async () => {
      const result = await newScenario()
        .withIdsCacheFile(ADDON_IDS_CACHE)
        .when({ method: 'GET', path: BACKUPS_ENDPOINT })
        .respond({
          status: 200,
          body: [backupEntry({ id: OTHER_BACKUP_ID, downloadUrl: `${apiHost}/downloads/${OTHER_BACKUP_ID}` })],
        })
        .thenRunCli(['database', 'backups', 'download', ADDON_ID, BACKUP_ID], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 1);
        });

      assert.strictEqual(result.stdout, '');
      assert.strictEqual(result.stderr, '[ERROR] no backup with this ID');
    });

    it('errors when the backup list is empty', async () => {
      const result = await newScenario()
        .withIdsCacheFile(ADDON_IDS_CACHE)
        .when({ method: 'GET', path: BACKUPS_ENDPOINT })
        .respond({ status: 200, body: [] })
        .thenRunCli(['database', 'backups', 'download', ADDON_ID, BACKUP_ID], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 1);
        });

      assert.strictEqual(result.stdout, '');
      assert.strictEqual(result.stderr, '[ERROR] no backup with this ID');
    });
  });

  describe('API errors', () => {
    it('reports the error body when the backups list endpoint returns a non-2xx status', async () => {
      const result = await newScenario()
        .withIdsCacheFile(ADDON_IDS_CACHE)
        .when({ method: 'GET', path: BACKUPS_ENDPOINT })
        .respond({ status: 500, body: { error: 'oops' } })
        .thenRunCli(['database', 'backups', 'download', ADDON_ID, BACKUP_ID], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 1);
        });

      assert.strictEqual(result.stdout, '');
      assert.strictEqual(result.stderr, '[ERROR] oops');
    });

    it('errors when the download URL returns a non-OK status', async () => {
      const downloadPath = `/downloads/${BACKUP_ID}`;
      const result = await newScenario()
        .withIdsCacheFile(ADDON_IDS_CACHE)
        .when({ method: 'GET', path: BACKUPS_ENDPOINT })
        .respond({ status: 200, body: [backupEntry({ downloadUrl: `${apiHost}${downloadPath}` })] })
        .when({ method: 'GET', path: downloadPath })
        .respond({ status: 500, body: { error: 'oops' } })
        .thenRunCli(['database', 'backups', 'download', ADDON_ID, BACKUP_ID], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 2);
        });

      assert.strictEqual(result.stdout, '');
      assert.strictEqual(result.stderr, '[ERROR] Failed to download backup');
    });
  });

  describe('no auth', () => {
    it('shows the not-logged-in error when the backups endpoint returns 401', async () => {
      const result = await newScenario()
        .withIdsCacheFile(ADDON_IDS_CACHE)
        .when({ method: 'GET', path: BACKUPS_ENDPOINT })
        .respond({ status: 401, body: { error: 'unauthorized' } })
        .thenRunCli(['database', 'backups', 'download', ADDON_ID, BACKUP_ID], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 1);
        });

      assert.strictEqual(result.stdout, '');
      assert.strictEqual(result.stderr, NOT_LOGGED_IN_ERROR);
    });
  });

  describe('addon ID resolution', () => {
    const ADDON_NAME = 'my-db';
    const downloadPath = `/downloads/${BACKUP_ID}`;

    /**
     * @param {ReturnType<NewCliScenario>} scenario
     */
    function withSuccessfulBackup(scenario) {
      return scenario
        .when({ method: 'GET', path: BACKUPS_ENDPOINT })
        .respond({ status: 200, body: [backupEntry({ downloadUrl: `${apiHost}${downloadPath}` })] })
        .when({ method: 'GET', path: downloadPath })
        .respond({ status: 200, body: BACKUP_CONTENT });
    }

    // === addon ID (addon_<UUID>) ===

    it('resolves an addon ID from cache without calling /v2/summary', async () => {
      const result = await withSuccessfulBackup(newScenario().withIdsCacheFile(ADDON_IDS_CACHE))
        .thenRunCli(['database', 'backups', 'download', ADDON_ID, BACKUP_ID])
        .verify((calls) => {
          assert.strictEqual(calls.count, 2);
          assert.strictEqual(calls.first.pathParams?.realAddonId, REAL_ADDON_ID);
          assert.strictEqual(calls.last.path, downloadPath);
        });

      assert.strictEqual(result.stdout, BACKUP_CONTENT);
      assert.strictEqual(result.stderr, '');
    });

    it('resolves an addon ID via /v2/summary when cache is empty', async () => {
      const result = await withSuccessfulBackup(
        newScenario().when({ method: 'GET', path: '/v2/summary' }).respond({ status: 200, body: SUMMARY }),
      )
        .thenRunCli(['database', 'backups', 'download', ADDON_ID, BACKUP_ID])
        .verify((calls) => {
          assert.strictEqual(calls.count, 3);
          assert.strictEqual(calls.first.path, '/v2/summary');
        });

      assert.strictEqual(result.stdout, BACKUP_CONTENT);
      assert.strictEqual(result.stderr, '');
    });

    it('errors when an addon ID is not in cache and not in /v2/summary', async () => {
      const result = await newScenario()
        .when({ method: 'GET', path: '/v2/summary' })
        .respond({ status: 200, body: SUMMARY })
        .thenRunCli(['database', 'backups', 'download', 'addon_unknown', BACKUP_ID], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 1);
          assert.strictEqual(calls.first.path, '/v2/summary');
        });

      assert.strictEqual(result.stdout, '');
      assert.strictEqual(result.stderr, '[ERROR] Add-on addon_unknown does not exist');
    });

    it('errors when an addon ID is not in cache and /v2/summary returns 404', async () => {
      const result = await newScenario()
        .when({ method: 'GET', path: '/v2/summary' })
        .respond({ status: 404, body: { error: 'not found' } })
        .thenRunCli(['database', 'backups', 'download', ADDON_ID, BACKUP_ID], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 1);
          assert.strictEqual(calls.first.path, '/v2/summary');
        });

      assert.strictEqual(result.stdout, '');
      assert.strictEqual(result.stderr, '[ERROR] not found');
    });

    // === real ID (postgresql_<UUID>) ===

    it('resolves a real ID from cache without calling /v2/summary', async () => {
      const result = await withSuccessfulBackup(newScenario().withIdsCacheFile(ADDON_IDS_CACHE))
        .thenRunCli(['database', 'backups', 'download', REAL_ADDON_ID, BACKUP_ID])
        .verify((calls) => {
          assert.strictEqual(calls.count, 2);
          assert.strictEqual(calls.first.pathParams?.realAddonId, REAL_ADDON_ID);
          assert.strictEqual(calls.last.path, downloadPath);
        });

      assert.strictEqual(result.stdout, BACKUP_CONTENT);
      assert.strictEqual(result.stderr, '');
    });

    it('resolves a real ID via /v2/summary when cache is empty', async () => {
      const result = await withSuccessfulBackup(
        newScenario().when({ method: 'GET', path: '/v2/summary' }).respond({ status: 200, body: SUMMARY }),
      )
        .thenRunCli(['database', 'backups', 'download', REAL_ADDON_ID, BACKUP_ID])
        .verify((calls) => {
          assert.strictEqual(calls.count, 3);
          assert.strictEqual(calls.first.path, '/v2/summary');
        });

      assert.strictEqual(result.stdout, BACKUP_CONTENT);
      assert.strictEqual(result.stderr, '');
    });

    it('errors when a real ID is not in cache and not in /v2/summary', async () => {
      const unknownRealId = 'postgresql_99999999-9999-9999-9999-999999999999';
      const result = await newScenario()
        .when({ method: 'GET', path: '/v2/summary' })
        .respond({ status: 200, body: SUMMARY })
        .thenRunCli(['database', 'backups', 'download', unknownRealId, BACKUP_ID], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 1);
          assert.strictEqual(calls.first.path, '/v2/summary');
        });

      assert.strictEqual(result.stdout, '');
      assert.strictEqual(result.stderr, `[ERROR] Add-on ${unknownRealId} does not exist`);
    });

    it('errors when a real ID is not in cache and /v2/summary returns 404', async () => {
      const result = await newScenario()
        .when({ method: 'GET', path: '/v2/summary' })
        .respond({ status: 404, body: { error: 'not found' } })
        .thenRunCli(['database', 'backups', 'download', REAL_ADDON_ID, BACKUP_ID], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 1);
          assert.strictEqual(calls.first.path, '/v2/summary');
        });

      assert.strictEqual(result.stdout, '');
      assert.strictEqual(result.stderr, '[ERROR] not found');
    });

    // === addon name — not supported by resolveAddon, always errors ===

    it('errors when an addon name is passed (cache hit by name is not supported)', async () => {
      const result = await newScenario()
        .withIdsCacheFile(ADDON_IDS_CACHE)
        .when({ method: 'GET', path: '/v2/summary' })
        .respond({ status: 200, body: SUMMARY })
        .thenRunCli(['database', 'backups', 'download', ADDON_NAME, BACKUP_ID], { expectExitCode: 1 })
        .verify((calls) => {
          assert.strictEqual(calls.count, 1);
          assert.strictEqual(calls.first.path, '/v2/summary');
        });

      assert.strictEqual(result.stdout, '');
      assert.strictEqual(result.stderr, `[ERROR] Add-on ${ADDON_NAME} does not exist`);
    });
  });
});
