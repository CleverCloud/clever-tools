import { describe, it } from 'node:test';
import { assertCleverResult } from '../../../test/assert-clever-result.ts';
import { ADDON_FS_BUCKET_PHP, ADDON_POSTGRESQL } from '../../../test/fixtures/addon.ts';
import { APP_NODE, APP_PHP } from '../../../test/fixtures/application.ts';
import { KUBERNETES_CLUSTER } from '../../../test/fixtures/kubernetes.ts';
import { NETWORK_GROUP } from '../../../test/fixtures/network-group.ts';
import { ORGANISATION_FOO } from '../../../test/fixtures/organisation.ts';
import { rawSummary } from '../../../test/fixtures/summary.ts';
import { USER_SELF } from '../../../test/fixtures/user.ts';
import { assertApiCalls } from '../../../test/lib/api/assert-api-calls.ts';
import { setupCleverSandbox } from '../../../test/setup-clever-sandbox.ts';

describe('clever tags add', () => {
  const { apiMock, fsMock, runClever } = setupCleverSandbox();

  describe('Happy path', () => {
    it('with an application in the IDs cache, should add the tag to the application', async () => {
      fsMock.writeExperimentalFeaturesFile({ tags: true });
      fsMock.writeIdsCacheFile({ owners: { [APP_NODE.id]: APP_NODE.ownerId }, addons: {} });
      await apiMock.respond('GET', `/v2/organisations/${APP_NODE.ownerId}/applications/${APP_NODE.id}`, 200, APP_NODE);
      await apiMock.respond('PUT', `/v2/organisations/${APP_NODE.ownerId}/applications/${APP_NODE.id}/tags/four`, 200, [
        'four',
        'one',
      ]);

      const result = await runClever(['tags', 'add', APP_NODE.id, 'four']);

      assertCleverResult(result, {
        exitCode: 0,
        stdoutText: `✓ Tag four added to application my-node-app (${APP_NODE.id})`,
      });
      assertApiCalls(await apiMock.getCalls(), [
        { method: 'GET', path: `/v2/organisations/${APP_NODE.ownerId}/applications/${APP_NODE.id}` },
        { method: 'PUT', path: `/v2/organisations/${APP_NODE.ownerId}/applications/${APP_NODE.id}/tags/four` },
      ]);
    });

    it('with an SFTP application and its FS bucket add-on, should add the tag to both', async () => {
      fsMock.writeExperimentalFeaturesFile({ tags: true });
      fsMock.writeIdsCacheFile({
        owners: { [APP_PHP.id]: APP_PHP.ownerId },
        addons: { [APP_PHP.id]: { addonId: ADDON_FS_BUCKET_PHP.id, realId: ADDON_FS_BUCKET_PHP.realId } },
      });
      await apiMock.respond('GET', `/v2/organisations/${APP_PHP.ownerId}/applications/${APP_PHP.id}`, 200, APP_PHP);
      await apiMock.respond(
        'GET',
        `/v2/organisations/${APP_PHP.ownerId}/addons/${ADDON_FS_BUCKET_PHP.id}`,
        200,
        ADDON_FS_BUCKET_PHP,
      );
      await apiMock.respond('PUT', `/v2/organisations/${APP_PHP.ownerId}/applications/${APP_PHP.id}/tags/four`, 200, [
        'four',
        'one',
        'two',
      ]);
      await apiMock.respond(
        'PUT',
        `/v2/organisations/${APP_PHP.ownerId}/addons/${ADDON_FS_BUCKET_PHP.id}/tags/four`,
        200,
        ['four', 'one', 'three', 'two'],
      );

      const result = await runClever(['tags', 'add', APP_PHP.id, 'four']);

      assertCleverResult(result, {
        exitCode: 0,
        stdoutText: `
          ✓ Tag four added to application my-php-app (${APP_PHP.id})
          ✓ Tag four added to add-on FS - my-php-app (${ADDON_FS_BUCKET_PHP.id})
        `,
      });
      assertApiCalls(await apiMock.getCalls(), [
        { method: 'GET', path: `/v2/organisations/${APP_PHP.ownerId}/applications/${APP_PHP.id}` },
        { method: 'GET', path: `/v2/organisations/${APP_PHP.ownerId}/addons/${ADDON_FS_BUCKET_PHP.id}` },
        { method: 'PUT', path: `/v2/organisations/${APP_PHP.ownerId}/applications/${APP_PHP.id}/tags/four` },
        { method: 'PUT', path: `/v2/organisations/${APP_PHP.ownerId}/addons/${ADDON_FS_BUCKET_PHP.id}/tags/four` },
      ]);
    });

    it('with a real add-on ID, should add the tag to the add-on through its add-on ID', async () => {
      fsMock.writeExperimentalFeaturesFile({ tags: true });
      fsMock.writeIdsCacheFile({
        owners: { [ADDON_POSTGRESQL.id]: ORGANISATION_FOO.id, [ADDON_POSTGRESQL.realId]: ORGANISATION_FOO.id },
        addons: {
          [ADDON_POSTGRESQL.id]: { addonId: ADDON_POSTGRESQL.id, realId: ADDON_POSTGRESQL.realId },
          [ADDON_POSTGRESQL.realId]: { addonId: ADDON_POSTGRESQL.id, realId: ADDON_POSTGRESQL.realId },
        },
      });
      await apiMock.respond(
        'GET',
        `/v2/organisations/${ORGANISATION_FOO.id}/addons/${ADDON_POSTGRESQL.id}`,
        200,
        ADDON_POSTGRESQL,
      );
      await apiMock.respond(
        'PUT',
        `/v2/organisations/${ORGANISATION_FOO.id}/addons/${ADDON_POSTGRESQL.id}/tags/four`,
        200,
        ['four'],
      );

      const result = await runClever(['tags', 'add', ADDON_POSTGRESQL.realId, 'four']);

      assertCleverResult(result, {
        exitCode: 0,
        stdoutText: `✓ Tag four added to add-on my-postgresql-addon (${ADDON_POSTGRESQL.id})`,
      });
      assertApiCalls(await apiMock.getCalls(), [
        { method: 'GET', path: `/v2/organisations/${ORGANISATION_FOO.id}/addons/${ADDON_POSTGRESQL.id}` },
        { method: 'PUT', path: `/v2/organisations/${ORGANISATION_FOO.id}/addons/${ADDON_POSTGRESQL.id}/tags/four` },
      ]);
    });

    it('with a Kubernetes cluster ID, should send the tags of the cluster with the new one', async () => {
      fsMock.writeExperimentalFeaturesFile({ tags: true });
      await apiMock.respond('GET', '/v2/summary', 200, rawSummary());
      await apiMock.respond(
        'GET',
        `/v4/kubernetes/organisations/${USER_SELF.id}/clusters/${KUBERNETES_CLUSTER.id}`,
        200,
        KUBERNETES_CLUSTER,
      );
      await apiMock.respond(
        'PATCH',
        `/v4/kubernetes/organisations/${USER_SELF.id}/clusters/${KUBERNETES_CLUSTER.id}`,
        200,
        {
          ...KUBERNETES_CLUSTER,
          tags: ['env:prod', 'team:platform', 'four'],
        },
      );

      const result = await runClever(['tags', 'add', KUBERNETES_CLUSTER.id, 'four']);

      assertCleverResult(result, {
        exitCode: 0,
        stdoutText: `✓ Tag four added to Kubernetes cluster my-cluster (${KUBERNETES_CLUSTER.id})`,
      });
      assertApiCalls(await apiMock.getCalls(), [
        { method: 'GET', path: '/v2/summary' },
        { method: 'GET', path: `/v4/kubernetes/organisations/${USER_SELF.id}/clusters/${KUBERNETES_CLUSTER.id}` },
        {
          method: 'PATCH',
          path: `/v4/kubernetes/organisations/${USER_SELF.id}/clusters/${KUBERNETES_CLUSTER.id}`,
          body: { tags: ['env:prod', 'team:platform', 'four'] },
        },
      ]);
    });

    it('with a Kubernetes cluster that already has the tag, should not update the cluster', async () => {
      fsMock.writeExperimentalFeaturesFile({ tags: true });
      await apiMock.respond('GET', '/v2/summary', 200, rawSummary());
      await apiMock.respond(
        'GET',
        `/v4/kubernetes/organisations/${USER_SELF.id}/clusters/${KUBERNETES_CLUSTER.id}`,
        200,
        KUBERNETES_CLUSTER,
      );

      const result = await runClever(['tags', 'add', KUBERNETES_CLUSTER.id, 'env:prod']);

      assertCleverResult(result, {
        exitCode: 0,
        stdoutText: `✓ Tag env:prod added to Kubernetes cluster my-cluster (${KUBERNETES_CLUSTER.id})`,
      });
      assertApiCalls(await apiMock.getCalls(), [
        { method: 'GET', path: '/v2/summary' },
        { method: 'GET', path: `/v4/kubernetes/organisations/${USER_SELF.id}/clusters/${KUBERNETES_CLUSTER.id}` },
      ]);
    });
    it('with a tag holding a comma and a space, should add it with the tag encoded in the path', async () => {
      fsMock.writeExperimentalFeaturesFile({ tags: true });
      fsMock.writeIdsCacheFile({ owners: { [APP_NODE.id]: APP_NODE.ownerId }, addons: {} });
      await apiMock.respond('GET', `/v2/organisations/${APP_NODE.ownerId}/applications/${APP_NODE.id}`, 200, APP_NODE);
      await apiMock.respond('PUT', `/v2/organisations/${APP_NODE.ownerId}/applications/${APP_NODE.id}/tags/:tag`, 200, [
        'a,b c',
      ]);

      const result = await runClever(['tags', 'add', APP_NODE.id, 'a,b c']);

      assertCleverResult(result, {
        exitCode: 0,
        stdoutText: `✓ Tag a,b c added to application my-node-app (${APP_NODE.id})`,
      });
      assertApiCalls(await apiMock.getCalls(), [
        { method: 'GET', path: `/v2/organisations/${APP_NODE.ownerId}/applications/${APP_NODE.id}` },
        { method: 'PUT', path: `/v2/organisations/${APP_NODE.ownerId}/applications/${APP_NODE.id}/tags/a%2Cb%20c` },
      ]);
    });
  });

  describe('CLI errors', () => {
    it('with an empty tag, should fail with a usage error', async () => {
      fsMock.writeExperimentalFeaturesFile({ tags: true });

      const result = await runClever(['tags', 'add', APP_NODE.id, '']);

      assertCleverResult(result, { exitCode: 1, usageError: 'tag: Tag must not be empty' });
      assertApiCalls(await apiMock.getCalls(), []);
    });
  });

  describe('Environment errors', () => {
    it('with a Network Group ID, should fail without calling the API', async () => {
      fsMock.writeExperimentalFeaturesFile({ tags: true });

      const result = await runClever(['tags', 'add', NETWORK_GROUP.id, 'four']);

      assertCleverResult(result, {
        exitCode: 1,
        stderrText: '[ERROR] Tags of Network Groups cannot be changed yet, only clever tags list works on them',
      });
      assertApiCalls(await apiMock.getCalls(), []);
    });
  });
});
