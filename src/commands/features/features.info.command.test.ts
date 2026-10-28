import { describe, it } from 'node:test';
import { assertCleverResult } from '../../../test/assert-clever-result.ts';
import { assertJsonFile } from '../../../test/lib/fs/assert-file.ts';
import { setupCleverSandbox } from '../../../test/setup-clever-sandbox.ts';

describe('clever features info', () => {
  const { fsMock, runClever } = setupCleverSandbox();

  describe('Happy path', () => {
    it('with system-git, should print its instructions', async () => {
      const result = await runClever(['features', 'info', 'system-git']);

      assertCleverResult(result, {
        exitCode: 0,
        stdoutText: `
          This feature switches from the pure JS implementation to using
          the git installed on your system. It is enabled by default since v5.0.0.

          Requirements:
            - git must be installed and available in your PATH

          Disable it to fall back to the previous pure JS implementation:
            clever features disable system-git
        `,
      });
    });

    it('with k8s, should print its instructions with the documentation link', async () => {
      const result = await runClever(['features', 'info', 'k8s']);

      assertCleverResult(result, {
        exitCode: 0,
        stdoutText: `
          - Create a Kubernetes cluster:
              clever k8s create my-cluster
              clever k8s create my-cluster --org myOrg

          - List Kubernetes clusters:
              clever k8s list

          - Get details about a Kubernetes cluster:
              clever k8s get my-cluster

          - Get kubeconfig file for a Kubernetes cluster:
              clever k8s get-kubeconfig my-cluster
              clever k8s get-kubeconfig my-cluster > ~/.kube/config

          - Activate persistent storage on a Kubernetes cluster:
              clever k8s add-persistent-storage my-cluster

          - Delete a Kubernetes cluster:
              clever k8s delete my-cluster

          Learn more about Clever Kubernetes: https://www.clever.cloud/developers/doc/kubernetes/
        `,
      });
    });

    it('with ng, should print its instructions with the documentation link', async () => {
      const result = await runClever(['features', 'info', 'ng']);

      assertCleverResult(result, {
        exitCode: 0,
        stdoutText: `
          - Create a Network Group:
              clever ng create myNG
          - Create a Network Group with members (application, database add-on):
              clever ng create myNG --link app_xxx,postgresql_xxx
          - List Network Groups:
              clever ng
          - Delete a Network Group:
              clever ng delete myNG
          - (Un)Link an application or a database add-on to an existing Network Group:
              clever ng link app_xxx myNG
              clever ng unlink postgresql_xxx myNG
          - Get the WireGuard configuration of a peer:
              clever ng get-config peerIdOrLabel myNG
          - Get details about a Network Group, a member or a peer:
              clever ng get myNg
              clever ng get app_xxx
              clever ng get peerId
              clever ng get memberLabel
          - Search Network Groups, members or peers:
              clever ng search myQuery

          Learn more about Network Groups: https://www.clever.cloud/developers/doc/develop/network-groups/
        `,
      });
    });

    it('with operators, should print its instructions', async () => {
      const result = await runClever(['features', 'info', 'operators']);

      assertCleverResult(result, {
        exitCode: 0,
        stdoutText: `
          clever keycloak
          clever keycloak get keycloak_xxx
          clever keycloak ng enable myKeycloak

          clever metabase version check myMetabase
          clever metabase version update myMetabase 0.53

          clever matomo open myMatomo
          clever otoroshi open logs myOtoroshi
        `,
      });
    });

    it('with a feature enabled in the experimental features file, should print the same instructions', async () => {
      fsMock.writeExperimentalFeaturesFile({ k8s: true });

      const result = await runClever(['features', 'info', 'k8s']);

      assertCleverResult(result, {
        exitCode: 0,
        stdoutText: `
          - Create a Kubernetes cluster:
              clever k8s create my-cluster
              clever k8s create my-cluster --org myOrg

          - List Kubernetes clusters:
              clever k8s list

          - Get details about a Kubernetes cluster:
              clever k8s get my-cluster

          - Get kubeconfig file for a Kubernetes cluster:
              clever k8s get-kubeconfig my-cluster
              clever k8s get-kubeconfig my-cluster > ~/.kube/config

          - Activate persistent storage on a Kubernetes cluster:
              clever k8s add-persistent-storage my-cluster

          - Delete a Kubernetes cluster:
              clever k8s delete my-cluster

          Learn more about Clever Kubernetes: https://www.clever.cloud/developers/doc/kubernetes/
        `,
      });
      assertJsonFile(fsMock.experimentalFeaturesFilePath(), { k8s: true });
    });
  });

  describe('CLI errors', () => {
    it('should reject a missing feature', async () => {
      const result = await runClever(['features', 'info']);

      assertCleverResult(result, { exitCode: 1, usageError: 'feature: missing value' });
    });

    it('with an unknown feature, should fail', async () => {
      const result = await runClever(['features', 'info', 'foo']);

      assertCleverResult(result, { exitCode: 1, stderrText: '[ERROR] Unavailable feature: foo' });
    });

    it('with a feature name in another case, should fail', async () => {
      const result = await runClever(['features', 'info', 'K8S']);

      assertCleverResult(result, { exitCode: 1, stderrText: '[ERROR] Unavailable feature: K8S' });
    });

    it('with a comma-separated list, should fail with the whole text as feature name', async () => {
      const result = await runClever(['features', 'info', 'k8s,ng']);

      assertCleverResult(result, { exitCode: 1, stderrText: '[ERROR] Unavailable feature: k8s,ng' });
    });
  });
});
