import { describe, it } from 'node:test';
import { assertCleverResult } from '../../../test/assert-clever-result.ts';
import { ADDON_FS_BUCKET_PHP, ADDON_POSTGRESQL, type RawAddon } from '../../../test/fixtures/addon.ts';
import { APP_NODE, APP_PHP, type RawApplication } from '../../../test/fixtures/application.ts';
import { KUBERNETES_CLUSTER } from '../../../test/fixtures/kubernetes.ts';
import { NETWORK_GROUP } from '../../../test/fixtures/network-group.ts';
import { ORGANISATION_FOO } from '../../../test/fixtures/organisation.ts';
import { rawSummary } from '../../../test/fixtures/summary.ts';
import { USER_SELF } from '../../../test/fixtures/user.ts';
import { assertApiCalls } from '../../../test/lib/api/assert-api-calls.ts';
import { setupCleverSandbox } from '../../../test/setup-clever-sandbox.ts';

describe('clever tags list', () => {
  const { apiMock, fsMock, runClever } = setupCleverSandbox();

  /** Answers `GET` on the application and on its tags. */
  async function mockGetApplicationTags(application: RawApplication, tags: Array<string>) {
    await apiMock.respond(
      'GET',
      `/v2/organisations/${application.ownerId}/applications/${application.id}`,
      200,
      application,
    );
    await apiMock.respond(
      'GET',
      `/v2/organisations/${application.ownerId}/applications/${application.id}/tags`,
      200,
      tags,
    );
  }

  /** Answers `GET` on the add-on of the owner and on its tags. */
  async function mockGetAddonTags(ownerId: string, addon: RawAddon, tags: Array<string>) {
    await apiMock.respond('GET', `/v2/organisations/${ownerId}/addons/${addon.id}`, 200, addon);
    await apiMock.respond('GET', `/v2/organisations/${ownerId}/addons/${addon.id}/tags`, 200, tags);
  }

  describe('Happy path', () => {
    it('with an application in the IDs cache, should print its tags in human format', async () => {
      fsMock.writeExperimentalFeaturesFile({ tags: true });
      fsMock.writeIdsCacheFile({ owners: { [APP_NODE.id]: APP_NODE.ownerId }, addons: {} });
      await mockGetApplicationTags(APP_NODE, ['one', 'two']);

      const result = await runClever(['tags', 'list', APP_NODE.id]);

      assertCleverResult(result, {
        exitCode: 0,
        stdoutText: `
          🔎 Found 2 tags on application my-node-app (${APP_NODE.id}):
            • one
            • two
        `,
      });
      assertApiCalls(await apiMock.getCalls(), [
        { method: 'GET', path: `/v2/organisations/${APP_NODE.ownerId}/applications/${APP_NODE.id}` },
        { method: 'GET', path: `/v2/organisations/${APP_NODE.ownerId}/applications/${APP_NODE.id}/tags` },
      ]);
    });

    it('with an application in the IDs cache, should print its tags in json format', async () => {
      fsMock.writeExperimentalFeaturesFile({ tags: true });
      fsMock.writeIdsCacheFile({ owners: { [APP_NODE.id]: APP_NODE.ownerId }, addons: {} });
      await mockGetApplicationTags(APP_NODE, ['one', 'two']);

      const result = await runClever(['tags', 'list', APP_NODE.id, '--format', 'json']);

      assertCleverResult(result, {
        exitCode: 0,
        stdoutJson: { type: 'application', id: APP_NODE.id, name: 'my-node-app', tags: ['one', 'two'] },
      });
    });

    it('with a single tag, should print it with a singular', async () => {
      fsMock.writeExperimentalFeaturesFile({ tags: true });
      fsMock.writeIdsCacheFile({ owners: { [APP_NODE.id]: APP_NODE.ownerId }, addons: {} });
      await mockGetApplicationTags(APP_NODE, ['one']);

      const result = await runClever(['tags', 'list', APP_NODE.id]);

      assertCleverResult(result, {
        exitCode: 0,
        stdoutText: `
          🔎 Found 1 tag on application my-node-app (${APP_NODE.id}):
            • one
        `,
      });
    });

    it('with no tag, should print how to add one', async () => {
      fsMock.writeExperimentalFeaturesFile({ tags: true });
      fsMock.writeIdsCacheFile({ owners: { [APP_NODE.id]: APP_NODE.ownerId }, addons: {} });
      await mockGetApplicationTags(APP_NODE, []);

      const result = await runClever(['tags', 'list', APP_NODE.id]);

      assertCleverResult(result, {
        exitCode: 0,
        stdoutText: `🔎 No tag found on application my-node-app (${APP_NODE.id}), add one with clever tags add ${APP_NODE.id} <tag> command`,
      });
    });

    it('with an SFTP application and its FS bucket add-on, should only print the tags of the application', async () => {
      fsMock.writeExperimentalFeaturesFile({ tags: true });
      fsMock.writeIdsCacheFile({
        owners: { [APP_PHP.id]: APP_PHP.ownerId },
        addons: { [APP_PHP.id]: { addonId: ADDON_FS_BUCKET_PHP.id, realId: ADDON_FS_BUCKET_PHP.realId } },
      });
      await mockGetApplicationTags(APP_PHP, ['one', 'two']);

      const result = await runClever(['tags', 'list', APP_PHP.id]);

      assertCleverResult(result, {
        exitCode: 0,
        stdoutText: `
          🔎 Found 2 tags on application my-php-app (${APP_PHP.id}):
            • one
            • two
        `,
      });
      assertApiCalls(await apiMock.getCalls(), [
        { method: 'GET', path: `/v2/organisations/${APP_PHP.ownerId}/applications/${APP_PHP.id}` },
        { method: 'GET', path: `/v2/organisations/${APP_PHP.ownerId}/applications/${APP_PHP.id}/tags` },
      ]);
    });

    it('with an application missing from the IDs cache, should find its owner in the summary and print its tags', async () => {
      fsMock.writeExperimentalFeaturesFile({ tags: true });
      await apiMock.respond(
        'GET',
        '/v2/summary',
        200,
        rawSummary({ organisations: [{ organisation: ORGANISATION_FOO, role: 'ADMIN', applications: [APP_PHP] }] }),
      );
      await mockGetApplicationTags(APP_PHP, ['one']);

      const result = await runClever(['tags', 'list', APP_PHP.id]);

      assertCleverResult(result, {
        exitCode: 0,
        stdoutText: `
          🔎 Found 1 tag on application my-php-app (${APP_PHP.id}):
            • one
        `,
      });
      assertApiCalls(await apiMock.getCalls(), [
        { method: 'GET', path: '/v2/summary' },
        { method: 'GET', path: `/v2/organisations/${APP_PHP.ownerId}/applications/${APP_PHP.id}` },
        { method: 'GET', path: `/v2/organisations/${APP_PHP.ownerId}/applications/${APP_PHP.id}/tags` },
      ]);
    });

    it('with an add-on ID, should print the tags of the add-on', async () => {
      fsMock.writeExperimentalFeaturesFile({ tags: true });
      fsMock.writeIdsCacheFile({
        owners: { [ADDON_POSTGRESQL.id]: ORGANISATION_FOO.id, [ADDON_POSTGRESQL.realId]: ORGANISATION_FOO.id },
        addons: {
          [ADDON_POSTGRESQL.id]: { addonId: ADDON_POSTGRESQL.id, realId: ADDON_POSTGRESQL.realId },
          [ADDON_POSTGRESQL.realId]: { addonId: ADDON_POSTGRESQL.id, realId: ADDON_POSTGRESQL.realId },
        },
      });
      await mockGetAddonTags(ORGANISATION_FOO.id, ADDON_POSTGRESQL, ['one', 'two', 'three']);

      const result = await runClever(['tags', 'list', ADDON_POSTGRESQL.id]);

      assertCleverResult(result, {
        exitCode: 0,
        stdoutText: `
          🔎 Found 3 tags on add-on my-postgresql-addon (${ADDON_POSTGRESQL.id}):
            • one
            • two
            • three
        `,
      });
      assertApiCalls(await apiMock.getCalls(), [
        { method: 'GET', path: `/v2/organisations/${ORGANISATION_FOO.id}/addons/${ADDON_POSTGRESQL.id}` },
        { method: 'GET', path: `/v2/organisations/${ORGANISATION_FOO.id}/addons/${ADDON_POSTGRESQL.id}/tags` },
      ]);
    });

    it('with a real add-on ID, should print the tags of the add-on through its add-on ID', async () => {
      fsMock.writeExperimentalFeaturesFile({ tags: true });
      fsMock.writeIdsCacheFile({
        owners: { [ADDON_POSTGRESQL.id]: ORGANISATION_FOO.id, [ADDON_POSTGRESQL.realId]: ORGANISATION_FOO.id },
        addons: {
          [ADDON_POSTGRESQL.id]: { addonId: ADDON_POSTGRESQL.id, realId: ADDON_POSTGRESQL.realId },
          [ADDON_POSTGRESQL.realId]: { addonId: ADDON_POSTGRESQL.id, realId: ADDON_POSTGRESQL.realId },
        },
      });
      await mockGetAddonTags(ORGANISATION_FOO.id, ADDON_POSTGRESQL, ['one']);

      const result = await runClever(['tags', 'list', ADDON_POSTGRESQL.realId]);

      assertCleverResult(result, {
        exitCode: 0,
        stdoutText: `
          🔎 Found 1 tag on add-on my-postgresql-addon (${ADDON_POSTGRESQL.id}):
            • one
        `,
      });
      assertApiCalls(await apiMock.getCalls(), [
        { method: 'GET', path: `/v2/organisations/${ORGANISATION_FOO.id}/addons/${ADDON_POSTGRESQL.id}` },
        { method: 'GET', path: `/v2/organisations/${ORGANISATION_FOO.id}/addons/${ADDON_POSTGRESQL.id}/tags` },
      ]);
    });

    it('with a Kubernetes cluster ID and the personal space listed twice in the summary, should look for the cluster once per owner and print its tags', async () => {
      fsMock.writeExperimentalFeaturesFile({ tags: true });
      await apiMock.respond('GET', '/v2/summary', 200, rawSummary());
      await apiMock.respond(
        'GET',
        `/v4/kubernetes/organisations/${USER_SELF.id}/clusters/${KUBERNETES_CLUSTER.id}`,
        200,
        KUBERNETES_CLUSTER,
      );

      const result = await runClever(['tags', 'list', KUBERNETES_CLUSTER.id]);

      assertCleverResult(result, {
        exitCode: 0,
        stdoutText: `
          🔎 Found 2 tags on Kubernetes cluster my-cluster (${KUBERNETES_CLUSTER.id}):
            • env:prod
            • team:platform
        `,
      });
      assertApiCalls(await apiMock.getCalls(), [
        { method: 'GET', path: '/v2/summary' },
        { method: 'GET', path: `/v4/kubernetes/organisations/${USER_SELF.id}/clusters/${KUBERNETES_CLUSTER.id}` },
      ]);
    });

    it('with a Network Group ID, should find its owner and print its tags', async () => {
      fsMock.writeExperimentalFeaturesFile({ tags: true });
      await apiMock.respond('GET', '/v2/summary', 200, rawSummary());
      await apiMock.respond(
        'GET',
        `/v4/networkgroups/organisations/${USER_SELF.id}/networkgroups/${NETWORK_GROUP.id}`,
        200,
        NETWORK_GROUP,
      );

      const result = await runClever(['tags', 'list', NETWORK_GROUP.id]);

      assertCleverResult(result, {
        exitCode: 0,
        stdoutText: `
          🔎 Found 1 tag on Network Group my-network-group (${NETWORK_GROUP.id}):
            • env:prod
        `,
      });
      assertApiCalls(await apiMock.getCalls(), [
        { method: 'GET', path: '/v2/summary' },
        { method: 'GET', path: `/v4/networkgroups/organisations/${USER_SELF.id}/networkgroups/${NETWORK_GROUP.id}` },
      ]);
    });
    it('with a Network Group of an organisation, should find it although the other owners answer 401', async () => {
      fsMock.writeExperimentalFeaturesFile({ tags: true });
      await apiMock.respond(
        'GET',
        '/v2/summary',
        200,
        rawSummary({ organisations: [{ organisation: ORGANISATION_FOO, role: 'ADMIN' }] }),
      );
      // current behavior of the API: a Network Group of another owner answers 401, not 403 nor 404
      await apiMock.respond(
        'GET',
        `/v4/networkgroups/organisations/${USER_SELF.id}/networkgroups/${NETWORK_GROUP.id}`,
        401,
        { code: 'clever.core.unauthorized' },
      );
      await apiMock.respond(
        'GET',
        `/v4/networkgroups/organisations/${ORGANISATION_FOO.id}/networkgroups/${NETWORK_GROUP.id}`,
        200,
        { ...NETWORK_GROUP, ownerId: ORGANISATION_FOO.id },
      );

      const result = await runClever(['tags', 'list', NETWORK_GROUP.id]);

      // The owners are probed in parallel: the order of the calls is not checked
      assertCleverResult(result, {
        exitCode: 0,
        stdoutText: `
          🔎 Found 1 tag on Network Group my-network-group (${NETWORK_GROUP.id}):
            • env:prod
        `,
      });
    });
  });

  describe('Environment errors', () => {
    it('with an application found in no owner, should fail with a not found error', async () => {
      fsMock.writeExperimentalFeaturesFile({ tags: true });
      await apiMock.respond('GET', '/v2/summary', 200, rawSummary());

      const result = await runClever(['tags', 'list', 'app_00000000-0000-4000-8000-000000000399']);

      assertCleverResult(result, {
        exitCode: 1,
        stderrText: '[ERROR] No application or add-on found with ID app_00000000-0000-4000-8000-000000000399',
      });
      assertApiCalls(await apiMock.getCalls(), [{ method: 'GET', path: '/v2/summary' }]);
    });

    it('with a Kubernetes cluster found in no owner, should fail with a not found error', async () => {
      fsMock.writeExperimentalFeaturesFile({ tags: true });
      await apiMock.respond('GET', '/v2/summary', 200, rawSummary());
      await apiMock.respond(
        'GET',
        `/v4/kubernetes/organisations/${USER_SELF.id}/clusters/kubernetes_00000000-0000-4000-8000-000000000799`,
        404,
        { error: 'Not found' },
      );

      const result = await runClever(['tags', 'list', 'kubernetes_00000000-0000-4000-8000-000000000799']);

      assertCleverResult(result, {
        exitCode: 1,
        stderrText: '[ERROR] No Kubernetes cluster found with ID kubernetes_00000000-0000-4000-8000-000000000799',
      });
    });

    it('with the tags feature disabled, should print the root help', async () => {
      // current behavior: a command hidden behind a disabled feature flag prints the root help, with no error message
      const result = await runClever(['tags', 'list', APP_NODE.id]);

      assertCleverResult(result, {
        exitCode: 1,
        stdoutMatch: /^CLI tool to manage Clever Cloud's data and products\n/,
      });
      assertApiCalls(await apiMock.getCalls(), []);
    });
  });
});
