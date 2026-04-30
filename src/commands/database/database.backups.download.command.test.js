import * as assert from 'node:assert';
import { after, before, beforeEach, describe, it } from 'node:test';
import { cliHooks } from '../../../test/cli-hooks.js';
import { ADDON_ID, ORGA_ID, UUID } from '../../../test/fixtures/id.js';
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
      addons: [
        {
          id: ADDON_ID,
          realId: REAL_ADDON_ID,
          name: 'my-db',
          providerId: 'postgresql-addon',
        },
      ],
      consumers: [],
    },
  ],
};

const IDS_CACHE = {
  owners: {
    [ADDON_ID]: ORGA_ID,
    [REAL_ADDON_ID]: ORGA_ID,
  },
  addons: {
    [ADDON_ID]: { addonId: ADDON_ID, realId: REAL_ADDON_ID },
    [REAL_ADDON_ID]: { addonId: ADDON_ID, realId: REAL_ADDON_ID },
  },
};

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

  it('should write backup content to stdout when --output is omitted', async () => {
    const downloadPath = `/downloads/${BACKUP_ID}`;
    const result = await newScenario()
      .withIdsCacheFile(IDS_CACHE)
      .when({ method: 'GET', path: '/v2/backups/:ownerId/:realAddonId' })
      .respond({
        status: 200,
        body: [
          {
            backup_id: OTHER_BACKUP_ID,
            creation_date: '2026-01-01T00:00:00Z',
            status: 'COMPLETED',
            download_url: `${apiHost}/downloads/${OTHER_BACKUP_ID}`,
          },
          {
            backup_id: BACKUP_ID,
            creation_date: '2026-02-01T00:00:00Z',
            status: 'COMPLETED',
            download_url: `${apiHost}${downloadPath}`,
          },
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

  it('should write backup content to a file when --output is provided', async () => {
    const downloadPath = `/downloads/${BACKUP_ID}`;
    const result = await newScenario()
      .withAppFile('placeholder', '')
      .withIdsCacheFile(IDS_CACHE)
      .when({ method: 'GET', path: '/v2/backups/:ownerId/:realAddonId' })
      .respond({
        status: 200,
        body: [
          {
            backup_id: BACKUP_ID,
            creation_date: '2026-02-01T00:00:00Z',
            status: 'COMPLETED',
            download_url: `${apiHost}${downloadPath}`,
          },
        ],
      })
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

  it('should accept --out as an alias for --output', async () => {
    const downloadPath = `/downloads/${BACKUP_ID}`;
    const result = await newScenario()
      .withAppFile('placeholder', '')
      .withIdsCacheFile(IDS_CACHE)
      .when({ method: 'GET', path: '/v2/backups/:ownerId/:realAddonId' })
      .respond({
        status: 200,
        body: [
          {
            backup_id: BACKUP_ID,
            creation_date: '2026-02-01T00:00:00Z',
            status: 'COMPLETED',
            download_url: `${apiHost}${downloadPath}`,
          },
        ],
      })
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

  it('should error when no backup matches the given ID', async () => {
    const result = await newScenario()
      .withIdsCacheFile(IDS_CACHE)
      .when({ method: 'GET', path: '/v2/backups/:ownerId/:realAddonId' })
      .respond({
        status: 200,
        body: [
          {
            backup_id: OTHER_BACKUP_ID,
            creation_date: '2026-01-01T00:00:00Z',
            status: 'COMPLETED',
            download_url: `${apiHost}/downloads/${OTHER_BACKUP_ID}`,
          },
        ],
      })
      .thenRunCli(['database', 'backups', 'download', ADDON_ID, BACKUP_ID], { expectExitCode: 1 })
      .verify((calls) => {
        assert.strictEqual(calls.count, 1);
      });

    assert.strictEqual(result.stdout, '');
    assert.strictEqual(result.stderr, '[ERROR] no backup with this ID');
  });

  it('should error when the addon list is empty', async () => {
    const result = await newScenario()
      .withIdsCacheFile(IDS_CACHE)
      .when({ method: 'GET', path: '/v2/backups/:ownerId/:realAddonId' })
      .respond({ status: 200, body: [] })
      .thenRunCli(['database', 'backups', 'download', ADDON_ID, BACKUP_ID], { expectExitCode: 1 })
      .verify((calls) => {
        assert.strictEqual(calls.count, 1);
      });

    assert.strictEqual(result.stdout, '');
    assert.strictEqual(result.stderr, '[ERROR] no backup with this ID');
  });

  it('should error when the download URL returns a non-OK status', async () => {
    const downloadPath = `/downloads/${BACKUP_ID}`;
    const result = await newScenario()
      .withIdsCacheFile(IDS_CACHE)
      .when({ method: 'GET', path: '/v2/backups/:ownerId/:realAddonId' })
      .respond({
        status: 200,
        body: [
          {
            backup_id: BACKUP_ID,
            creation_date: '2026-02-01T00:00:00Z',
            status: 'COMPLETED',
            download_url: `${apiHost}${downloadPath}`,
          },
        ],
      })
      .when({ method: 'GET', path: downloadPath })
      .respond({ status: 500, body: { error: 'oops' } })
      .thenRunCli(['database', 'backups', 'download', ADDON_ID, BACKUP_ID], { expectExitCode: 1 })
      .verify((calls) => {
        assert.strictEqual(calls.count, 2);
      });

    assert.strictEqual(result.stdout, '');
    assert.strictEqual(result.stderr, '[ERROR] Failed to download backup');
  });

  it('should error when the addon ID is unknown', async () => {
    const result = await newScenario()
      .when({ method: 'GET', path: '/v2/summary' })
      .respond({ status: 200, body: SUMMARY })
      .thenRunCli(['database', 'backups', 'download', 'addon_unknown', BACKUP_ID], { expectExitCode: 1 })
      .verify((calls) => {
        console.log(calls.first.path);
      });

    assert.strictEqual(result.stdout, '');
    assert.strictEqual(result.stderr, '[ERROR] Add-on addon_unknown does not exist');
  });

  it('should resolve the addon by its real ID', async () => {
    const downloadPath = `/downloads/${BACKUP_ID}`;
    const result = await newScenario()
      .when({ method: 'GET', path: '/v2/summary' })
      .respond({ status: 200, body: SUMMARY })
      .when({ method: 'GET', path: '/v2/backups/:ownerId/:realAddonId' })
      .respond({
        status: 200,
        body: [
          {
            backup_id: BACKUP_ID,
            creation_date: '2026-02-01T00:00:00Z',
            status: 'COMPLETED',
            download_url: `${apiHost}${downloadPath}`,
          },
        ],
      })
      .when({ method: 'GET', path: downloadPath })
      .respond({ status: 200, body: BACKUP_CONTENT })
      .thenRunCli(['database', 'backups', 'download', REAL_ADDON_ID, BACKUP_ID])
      .verify((calls) => {
        assert.strictEqual(calls.count, 3);
        assert.strictEqual(calls.first.path, '/v2/summary');
      });

    assert.strictEqual(result.stdout, BACKUP_CONTENT);
    assert.strictEqual(result.stderr, '');
  });

  describe('addon ID resolution', () => {
    const ADDON_NAME = 'my-db';
    const downloadPath = `/downloads/${BACKUP_ID}`;

    /**
     * @param {ReturnType<NewCliScenario>} scenario
     */
    function withSuccessfulBackup(scenario) {
      return scenario
        .when({ method: 'GET', path: '/v2/backups/:ownerId/:realAddonId' })
        .respond({
          status: 200,
          body: [
            {
              backup_id: BACKUP_ID,
              creation_date: '2026-02-01T00:00:00Z',
              status: 'COMPLETED',
              download_url: `${apiHost}${downloadPath}`,
            },
          ],
        })
        .when({ method: 'GET', path: downloadPath })
        .respond({ status: 200, body: BACKUP_CONTENT });
    }

    // === addon ID (addon_<UUID>) ===

    it('resolves an addon ID from cache without calling /v2/summary', async () => {
      const result = await withSuccessfulBackup(newScenario().withIdsCacheFile(IDS_CACHE))
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
      assert.match(result.stderr, /\[ERROR\]/);
    });

    // === real ID (postgresql_<UUID>) ===

    it('resolves a real ID from cache without calling /v2/summary', async () => {
      const result = await withSuccessfulBackup(newScenario().withIdsCacheFile(IDS_CACHE))
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
      assert.match(result.stderr, /\[ERROR\]/);
    });

    // === addon name — not supported by resolveAddon, always errors ===

    it('errors when an addon name is passed (cache hit by name is not supported)', async () => {
      const result = await newScenario()
        .withIdsCacheFile(IDS_CACHE)
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
