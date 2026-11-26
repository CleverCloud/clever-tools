import { describe, it } from 'node:test';
import { assertCleverResult } from '../../../test/assert-clever-result.ts';
import { ADDON_FS_BUCKET_PHP } from '../../../test/fixtures/addon.ts';
import { APP_NODE, APP_PHP } from '../../../test/fixtures/application.ts';
import { KUBERNETES_CLUSTER } from '../../../test/fixtures/kubernetes.ts';
import { NETWORK_GROUP } from '../../../test/fixtures/network-group.ts';
import { rawSummary } from '../../../test/fixtures/summary.ts';
import { USER_SELF } from '../../../test/fixtures/user.ts';
import { assertApiCalls } from '../../../test/lib/api/assert-api-calls.ts';
import { setupCleverSandbox } from '../../../test/setup-clever-sandbox.ts';

describe('clever tags remove', () => {
  const { apiMock, fsMock, runClever } = setupCleverSandbox();

  describe('Happy path', () => {
    it('with an application in the IDs cache, should remove the tag from the application', async () => {
      fsMock.writeExperimentalFeaturesFile({ tags: true });
      fsMock.writeIdsCacheFile({ owners: { [APP_NODE.id]: APP_NODE.ownerId }, addons: {} });
      await apiMock.respond('GET', `/v2/organisations/${APP_NODE.ownerId}/applications/${APP_NODE.id}`, 200, APP_NODE);
      await apiMock.respond(
        'DELETE',
        `/v2/organisations/${APP_NODE.ownerId}/applications/${APP_NODE.id}/tags/two`,
        200,
        ['one'],
      );

      const result = await runClever(['tags', 'remove', APP_NODE.id, 'two']);

      assertCleverResult(result, {
        exitCode: 0,
        stdoutText: `✓ Tag two removed from application my-node-app (${APP_NODE.id})`,
      });
      assertApiCalls(await apiMock.getCalls(), [
        { method: 'GET', path: `/v2/organisations/${APP_NODE.ownerId}/applications/${APP_NODE.id}` },
        { method: 'DELETE', path: `/v2/organisations/${APP_NODE.ownerId}/applications/${APP_NODE.id}/tags/two` },
      ]);
    });

    it('with an SFTP application and its FS bucket add-on, should remove the tag from both', async () => {
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
      await apiMock.respond('DELETE', `/v2/organisations/${APP_PHP.ownerId}/applications/${APP_PHP.id}/tags/two`, 200, [
        'one',
      ]);
      await apiMock.respond(
        'DELETE',
        `/v2/organisations/${APP_PHP.ownerId}/addons/${ADDON_FS_BUCKET_PHP.id}/tags/two`,
        200,
        ['one', 'three'],
      );

      const result = await runClever(['tags', 'remove', APP_PHP.id, 'two']);

      assertCleverResult(result, {
        exitCode: 0,
        stdoutText: `
          ✓ Tag two removed from application my-php-app (${APP_PHP.id})
          ✓ Tag two removed from add-on FS - my-php-app (${ADDON_FS_BUCKET_PHP.id})
        `,
      });
      assertApiCalls(await apiMock.getCalls(), [
        { method: 'GET', path: `/v2/organisations/${APP_PHP.ownerId}/applications/${APP_PHP.id}` },
        { method: 'GET', path: `/v2/organisations/${APP_PHP.ownerId}/addons/${ADDON_FS_BUCKET_PHP.id}` },
        { method: 'DELETE', path: `/v2/organisations/${APP_PHP.ownerId}/applications/${APP_PHP.id}/tags/two` },
        { method: 'DELETE', path: `/v2/organisations/${APP_PHP.ownerId}/addons/${ADDON_FS_BUCKET_PHP.id}/tags/two` },
      ]);
    });

    it('with an SFTP application whose FS bucket add-on lacks the tag, should remove it from the application and succeed', async () => {
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
      await apiMock.respond('DELETE', `/v2/organisations/${APP_PHP.ownerId}/applications/${APP_PHP.id}/tags/two`, 200, [
        'one',
      ]);
      await apiMock.respond(
        'DELETE',
        `/v2/organisations/${APP_PHP.ownerId}/addons/${ADDON_FS_BUCKET_PHP.id}/tags/two`,
        404,
        { id: 4004, message: 'Tag not found', type: 'error' },
      );

      const result = await runClever(['tags', 'remove', APP_PHP.id, 'two']);

      assertCleverResult(result, {
        exitCode: 0,
        stdoutText: `
          ✓ Tag two removed from application my-php-app (${APP_PHP.id})
          ✓ Tag two removed from add-on FS - my-php-app (${ADDON_FS_BUCKET_PHP.id})
        `,
      });
    });

    it('with a Kubernetes cluster ID, should send the tags of the cluster without the removed one', async () => {
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
          tags: ['env:prod'],
        },
      );

      const result = await runClever(['tags', 'remove', KUBERNETES_CLUSTER.id, 'team:platform']);

      assertCleverResult(result, {
        exitCode: 0,
        stdoutText: `✓ Tag team:platform removed from Kubernetes cluster my-cluster (${KUBERNETES_CLUSTER.id})`,
      });
      assertApiCalls(await apiMock.getCalls(), [
        { method: 'GET', path: '/v2/summary' },
        { method: 'GET', path: `/v4/kubernetes/organisations/${USER_SELF.id}/clusters/${KUBERNETES_CLUSTER.id}` },
        {
          method: 'PATCH',
          path: `/v4/kubernetes/organisations/${USER_SELF.id}/clusters/${KUBERNETES_CLUSTER.id}`,
          body: { tags: ['env:prod'] },
        },
      ]);
    });
  });

  describe('Environment errors', () => {
    it('with a Network Group ID, should fail without calling the API', async () => {
      fsMock.writeExperimentalFeaturesFile({ tags: true });

      const result = await runClever(['tags', 'remove', NETWORK_GROUP.id, 'two']);

      assertCleverResult(result, {
        exitCode: 1,
        stderrText: '[ERROR] Tags of Network Groups cannot be changed yet, only clever tags list works on them',
      });
      assertApiCalls(await apiMock.getCalls(), []);
    });
  });
});
