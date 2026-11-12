import { describe, it } from 'node:test';
import { assertCleverResult } from '../../../test/assert-clever-result.ts';
import { APP_NODE, LINKED_APP_NODE, LINKED_APP_PHP } from '../../../test/fixtures/app.ts';
import { DEPLOYMENT_NODE_OK, DEPLOYMENT_NODE_WIP, type RawDeployment } from '../../../test/fixtures/deployment.ts';
import { rawSummary } from '../../../test/fixtures/summary.ts';
import { assertApiCalls } from '../../../test/lib/api/assert-api-calls.ts';
import { setupCleverSandbox } from '../../../test/setup-clever-sandbox.ts';

describe('clever cancel-deploy', () => {
  const { apiMock, fsMock, runClever } = setupCleverSandbox();

  /** Answer the last deployments of `APP_NODE` with `deployments`. */
  async function mockGetDeployments(deployments: Array<RawDeployment>) {
    await apiMock.respond(
      'GET',
      `/v2/organisations/${APP_NODE.ownerId}/applications/${APP_NODE.id}/deployments`,
      200,
      deployments,
    );
  }

  /** Any deployment cancellation, whatever the IDs, so that `assertNoDeleteInstances()` catches a wrong one too. */
  const DELETE_INSTANCES_PATH = '/v2/organisations/:ownerId/applications/:appId/deployments/:deploymentId/instances';

  /** Answer any deployment cancellation: the tests check its IDs on the calls, or that there was none with `assertNoDeleteInstances()`. */
  async function mockDeleteInstances() {
    await apiMock.respond('DELETE', DELETE_INSTANCES_PATH, 204);
  }

  /** No deployment cancellation was sent. Needs `mockDeleteInstances()`: a call no mock answered is left out. */
  async function assertNoDeleteInstances() {
    assertApiCalls((await apiMock.getCalls()).filter({ method: 'DELETE', path: DELETE_INSTANCES_PATH }), []);
  }

  describe('Happy path', () => {
    it('with an ongoing deployment on the linked application, should cancel the deployment and print the success message', async () => {
      fsMock.writeAppConfigFile('myapp', { apps: [LINKED_APP_NODE] });
      fsMock.setCwd('myapp');
      await mockGetDeployments([DEPLOYMENT_NODE_WIP]);
      await mockDeleteInstances();

      const result = await runClever(['cancel-deploy']);

      assertCleverResult(result, {
        exitCode: 0,
        stdoutText: `✓ Deployment ${DEPLOYMENT_NODE_WIP.uuid} successfully cancelled!`,
      });
      assertApiCalls((await apiMock.getCalls()).filter({ method: 'DELETE', path: DELETE_INSTANCES_PATH }), [
        {
          method: 'DELETE',
          path: `/v2/organisations/${APP_NODE.ownerId}/applications/${APP_NODE.id}/deployments/${DEPLOYMENT_NODE_WIP.id}/instances`,
        },
      ]);
    });

    it('with --alias of one of several linked applications, should cancel the deployment of that application', async () => {
      fsMock.writeAppConfigFile('myapp', { apps: [LINKED_APP_PHP, LINKED_APP_NODE] });
      fsMock.setCwd('myapp');
      await mockGetDeployments([DEPLOYMENT_NODE_WIP]);
      await mockDeleteInstances();

      const result = await runClever(['cancel-deploy', '--alias', 'my-node-alias']);

      assertCleverResult(result, {
        exitCode: 0,
        stdoutText: `✓ Deployment ${DEPLOYMENT_NODE_WIP.uuid} successfully cancelled!`,
      });
      assertApiCalls((await apiMock.getCalls()).filter({ method: 'DELETE', path: DELETE_INSTANCES_PATH }), [
        {
          method: 'DELETE',
          path: `/v2/organisations/${APP_NODE.ownerId}/applications/${APP_NODE.id}/deployments/${DEPLOYMENT_NODE_WIP.id}/instances`,
        },
      ]);
    });

    it('with --app of an application that is not linked, should cancel its deployment', async () => {
      await apiMock.respond('GET', '/v2/summary', 200, rawSummary({ user: { applications: [APP_NODE] } }));
      await mockGetDeployments([DEPLOYMENT_NODE_WIP]);
      await mockDeleteInstances();

      const result = await runClever(['cancel-deploy', '--app', APP_NODE.id]);

      assertCleverResult(result, {
        exitCode: 0,
        stdoutText: `✓ Deployment ${DEPLOYMENT_NODE_WIP.uuid} successfully cancelled!`,
      });
      assertApiCalls((await apiMock.getCalls()).filter({ method: 'DELETE', path: DELETE_INSTANCES_PATH }), [
        {
          method: 'DELETE',
          path: `/v2/organisations/${APP_NODE.ownerId}/applications/${APP_NODE.id}/deployments/${DEPLOYMENT_NODE_WIP.id}/instances`,
        },
      ]);
    });
  });

  describe('Blocking API state', () => {
    describe('with no ongoing deployment in the last deployment', () => {
      it('with an empty deployments list, should refuse', async () => {
        fsMock.writeAppConfigFile('myapp', { apps: [LINKED_APP_NODE] });
        fsMock.setCwd('myapp');
        await mockGetDeployments([]);
        await mockDeleteInstances();

        const result = await runClever(['cancel-deploy']);

        assertCleverResult(result, {
          exitCode: 1,
          stderrText: '[ERROR] There is no ongoing deployment for this application',
        });
        await assertNoDeleteInstances();
      });

      it('with the last deployment finished, should refuse', async () => {
        fsMock.writeAppConfigFile('myapp', { apps: [LINKED_APP_NODE] });
        fsMock.setCwd('myapp');
        await mockGetDeployments([DEPLOYMENT_NODE_OK]);
        await mockDeleteInstances();

        const result = await runClever(['cancel-deploy']);

        assertCleverResult(result, {
          exitCode: 1,
          stderrText: '[ERROR] There is no ongoing deployment for this application',
        });
        await assertNoDeleteInstances();
      });

      it('with the last deployment failed, should refuse', async () => {
        fsMock.writeAppConfigFile('myapp', { apps: [LINKED_APP_NODE] });
        fsMock.setCwd('myapp');
        await mockGetDeployments([{ ...DEPLOYMENT_NODE_WIP, state: 'FAIL' }]);
        await mockDeleteInstances();

        const result = await runClever(['cancel-deploy']);

        assertCleverResult(result, {
          exitCode: 1,
          stderrText: '[ERROR] There is no ongoing deployment for this application',
        });
        await assertNoDeleteInstances();
      });

      it('with the last deployment already cancelled, should refuse', async () => {
        fsMock.writeAppConfigFile('myapp', { apps: [LINKED_APP_NODE] });
        fsMock.setCwd('myapp');
        await mockGetDeployments([{ ...DEPLOYMENT_NODE_WIP, state: 'CANCELLED' }]);
        await mockDeleteInstances();

        const result = await runClever(['cancel-deploy']);

        assertCleverResult(result, {
          exitCode: 1,
          stderrText: '[ERROR] There is no ongoing deployment for this application',
        });
        await assertNoDeleteInstances();
      });

      it('with an ongoing action that is not a deployment, should refuse', async () => {
        fsMock.writeAppConfigFile('myapp', { apps: [LINKED_APP_NODE] });
        fsMock.setCwd('myapp');
        await mockGetDeployments([{ ...DEPLOYMENT_NODE_WIP, action: 'UNDEPLOY' }]);
        await mockDeleteInstances();

        const result = await runClever(['cancel-deploy']);

        assertCleverResult(result, {
          exitCode: 1,
          stderrText: '[ERROR] There is no ongoing deployment for this application',
        });
        await assertNoDeleteInstances();
      });
    });
  });
});
