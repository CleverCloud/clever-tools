import { describe, it } from 'node:test';
import { assertCleverResult } from '../../../test/assert-clever-result.ts';
import { USER_SELF } from '../../../test/fixtures/user.ts';
import { setupCleverSandbox } from '../../../test/setup-clever-sandbox.ts';

const CLUSTER = {
  id: 'kubernetes_00000000-0000-4000-8000-000000000600',
  name: 'my-cluster',
  status: 'ACTIVE',
  version: '1.35',
  topologyConfig: { topology: 'ALL_IN_ONE', flavor: 'S', replicationFactor: 1 },
  features: { autoscalingEnabled: true, csi: false },
  tags: ['test', 'csi'],
  description: 'Persistent storage regression test',
  storageUsageBytes: 1024 ** 3,
};

describe('clever k8s get', () => {
  const { apiMock, fsMock, runClever } = setupCleverSandbox();

  describe('Happy path', () => {
    it('with persistent storage not installed, should print it as disabled in human format', async () => {
      fsMock.writeExperimentalFeaturesFile({ k8s: true });
      await apiMock.respond('GET', '/v2/self', 200, USER_SELF);
      await apiMock.respond('GET', `/v4/kubernetes/organisations/${USER_SELF.id}/clusters/${CLUSTER.id}`, 200, CLUSTER);

      const result = await runClever(['k8s', 'get', CLUSTER.id]);

      assertCleverResult(result, {
        exitCode: 0,
        stdoutText: `
          ┌────────────────────┬───────────────────────────────────────────────────┐
          │ (index)            │ Values                                            │
          ├────────────────────┼───────────────────────────────────────────────────┤
          │ Name               │ 'my-cluster'                                      │
          │ ID                 │ '${CLUSTER.id}' │
          │ Status             │ 'ACTIVE'                                          │
          │ Version            │ '1.35'                                            │
          │ Topology           │ 'ALL_IN_ONE (S, rf=1)'                            │
          │ Autoscaling        │ 'enabled'                                         │
          │ Persistent storage │ 'disabled'                                        │
          │ Tags               │ 'test, csi'                                       │
          │ Description        │ 'Persistent storage regression test'              │
          │ Storage            │ '1 GB'                                            │
          └────────────────────┴───────────────────────────────────────────────────┘

          Once ACTIVE, get the kubeconfig with clever k8s get-kubeconfig ${CLUSTER.id}
        `,
      });
    });

    it('with persistent storage installed, should print it as enabled in human format', async () => {
      fsMock.writeExperimentalFeaturesFile({ k8s: true });
      await apiMock.respond('GET', '/v2/self', 200, USER_SELF);
      await apiMock.respond('GET', `/v4/kubernetes/organisations/${USER_SELF.id}/clusters/${CLUSTER.id}`, 200, {
        ...CLUSTER,
        features: { autoscalingEnabled: true, csi: true },
      });

      const result = await runClever(['k8s', 'get', CLUSTER.id]);

      assertCleverResult(result, {
        exitCode: 0,
        stdoutText: `
          ┌────────────────────┬───────────────────────────────────────────────────┐
          │ (index)            │ Values                                            │
          ├────────────────────┼───────────────────────────────────────────────────┤
          │ Name               │ 'my-cluster'                                      │
          │ ID                 │ '${CLUSTER.id}' │
          │ Status             │ 'ACTIVE'                                          │
          │ Version            │ '1.35'                                            │
          │ Topology           │ 'ALL_IN_ONE (S, rf=1)'                            │
          │ Autoscaling        │ 'enabled'                                         │
          │ Persistent storage │ 'enabled'                                         │
          │ Tags               │ 'test, csi'                                       │
          │ Description        │ 'Persistent storage regression test'              │
          │ Storage            │ '1 GB'                                            │
          └────────────────────┴───────────────────────────────────────────────────┘

          Once ACTIVE, get the kubeconfig with clever k8s get-kubeconfig ${CLUSTER.id}
        `,
      });
    });

    it('with persistent storage not installed, should print the cluster as returned by the API in json format', async () => {
      fsMock.writeExperimentalFeaturesFile({ k8s: true });
      await apiMock.respond('GET', '/v2/self', 200, USER_SELF);
      await apiMock.respond('GET', `/v4/kubernetes/organisations/${USER_SELF.id}/clusters/${CLUSTER.id}`, 200, CLUSTER);

      const result = await runClever(['k8s', 'get', CLUSTER.id, '--format', 'json']);

      assertCleverResult(result, {
        exitCode: 0,
        stdoutJson: {
          id: CLUSTER.id,
          name: 'my-cluster',
          status: 'ACTIVE',
          version: '1.35',
          topologyConfig: { topology: 'ALL_IN_ONE', flavor: 'S', replicationFactor: 1 },
          features: { autoscalingEnabled: true, csi: false },
          tags: ['test', 'csi'],
          description: 'Persistent storage regression test',
          storageUsageBytes: 1073741824,
        },
      });
    });
  });
});
