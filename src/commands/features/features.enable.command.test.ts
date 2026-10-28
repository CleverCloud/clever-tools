import { describe, it } from 'node:test';
import { assertCleverResult } from '../../../test/assert-clever-result.ts';
import { assertJsonFile, assertNoFile } from '../../../test/lib/fs/assert-file.ts';
import { setupCleverSandbox } from '../../../test/setup-clever-sandbox.ts';

describe('clever features enable', () => {
  const { fsMock, runClever } = setupCleverSandbox();

  describe('Happy path', () => {
    it('with k8s and no experimental features file, should create the file and print the instructions', async () => {
      const result = await runClever(['features', 'enable', 'k8s']);

      assertCleverResult(result, {
        exitCode: 0,
        stdoutText: `
          Experimental feature 'k8s' enabled
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

    it('with ng, should write it and print its instructions', async () => {
      const result = await runClever(['features', 'enable', 'ng']);

      assertCleverResult(result, {
        exitCode: 0,
        stdoutText: `
          Experimental feature 'ng' enabled
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
      assertJsonFile(fsMock.experimentalFeaturesFilePath(), { ng: true });
    });

    it('with operators, should write it and print its instructions', async () => {
      const result = await runClever(['features', 'enable', 'operators']);

      assertCleverResult(result, {
        exitCode: 0,
        stdoutText: `
          Experimental feature 'operators' enabled
          clever keycloak
          clever keycloak get keycloak_xxx
          clever keycloak ng enable myKeycloak

          clever metabase version check myMetabase
          clever metabase version update myMetabase 0.53

          clever matomo open myMatomo
          clever otoroshi open logs myOtoroshi
        `,
      });
      assertJsonFile(fsMock.experimentalFeaturesFilePath(), { operators: true });
    });

    it('with system-git, which is enabled by default, should write it and print its instructions', async () => {
      const result = await runClever(['features', 'enable', 'system-git']);

      assertCleverResult(result, {
        exitCode: 0,
        stdoutText: `
          Experimental feature 'system-git' enabled
          This feature switches from the pure JS implementation to using
          the git installed on your system. It is enabled by default since v5.0.0.

          Requirements:
            - git must be installed and available in your PATH

          Disable it to fall back to the previous pure JS implementation:
            clever features disable system-git
        `,
      });
      assertJsonFile(fsMock.experimentalFeaturesFilePath(), { 'system-git': true });
    });

    it('with 2 features, should enable both and print the hint instead of the instructions', async () => {
      const result = await runClever(['features', 'enable', 'k8s,ng']);

      assertCleverResult(result, {
        exitCode: 0,
        stdoutText: `
          Experimental feature 'k8s' enabled
          Experimental feature 'ng' enabled

          To learn more about these experimental features, use 'clever features info FEATURE_NAME'
        `,
      });
      assertJsonFile(fsMock.experimentalFeaturesFilePath(), { k8s: true, ng: true });
    });

    it('with the same feature twice, should confirm it twice and print the hint', async () => {
      const result = await runClever(['features', 'enable', 'k8s,k8s']);

      assertCleverResult(result, {
        exitCode: 0,
        stdoutText: `
          Experimental feature 'k8s' enabled
          Experimental feature 'k8s' enabled

          To learn more about these experimental features, use 'clever features info FEATURE_NAME'
        `,
      });
      assertJsonFile(fsMock.experimentalFeaturesFilePath(), { k8s: true });
    });

    it('with an experimental features file holding other features, should keep them', async () => {
      fsMock.writeExperimentalFeaturesFile({ ng: true, 'system-git': false });

      const result = await runClever(['features', 'enable', 'operators']);

      assertCleverResult(result, {
        exitCode: 0,
        stdoutText: `
          Experimental feature 'operators' enabled
          clever keycloak
          clever keycloak get keycloak_xxx
          clever keycloak ng enable myKeycloak

          clever metabase version check myMetabase
          clever metabase version update myMetabase 0.53

          clever matomo open myMatomo
          clever otoroshi open logs myOtoroshi
        `,
      });
      assertJsonFile(fsMock.experimentalFeaturesFilePath(), {
        ng: true,
        'system-git': false,
        operators: true,
      });
    });

    it('with a feature explicitly disabled in the file, should set it to true', async () => {
      fsMock.writeExperimentalFeaturesFile({ operators: false });

      const result = await runClever(['features', 'enable', 'operators']);

      assertCleverResult(result, {
        exitCode: 0,
        stdoutText: `
          Experimental feature 'operators' enabled
          clever keycloak
          clever keycloak get keycloak_xxx
          clever keycloak ng enable myKeycloak

          clever metabase version check myMetabase
          clever metabase version update myMetabase 0.53

          clever matomo open myMatomo
          clever otoroshi open logs myOtoroshi
        `,
      });
      assertJsonFile(fsMock.experimentalFeaturesFilePath(), { operators: true });
    });

    it('with a feature already enabled in the file, should print the same output and keep it enabled', async () => {
      fsMock.writeExperimentalFeaturesFile({ operators: true });

      const result = await runClever(['features', 'enable', 'operators']);

      assertCleverResult(result, {
        exitCode: 0,
        stdoutText: `
          Experimental feature 'operators' enabled
          clever keycloak
          clever keycloak get keycloak_xxx
          clever keycloak ng enable myKeycloak

          clever metabase version check myMetabase
          clever metabase version update myMetabase 0.53

          clever matomo open myMatomo
          clever otoroshi open logs myOtoroshi
        `,
      });
      assertJsonFile(fsMock.experimentalFeaturesFilePath(), { operators: true });
    });

    it('with an experimental features file holding an unknown feature, should drop it from the file', async () => {
      // The unknown key is stripped when the file is loaded.
      fsMock.writeExperimentalFeaturesFile({ unknown: true, ng: true });

      const result = await runClever(['features', 'enable', 'operators']);

      assertCleverResult(result, {
        exitCode: 0,
        stdoutText: `
          Experimental feature 'operators' enabled
          clever keycloak
          clever keycloak get keycloak_xxx
          clever keycloak ng enable myKeycloak

          clever metabase version check myMetabase
          clever metabase version update myMetabase 0.53

          clever matomo open myMatomo
          clever otoroshi open logs myOtoroshi
        `,
      });
      assertJsonFile(fsMock.experimentalFeaturesFilePath(), { ng: true, operators: true });
    });
  });

  describe('CLI errors', () => {
    it('should reject a missing feature', async () => {
      const result = await runClever(['features', 'enable']);

      assertCleverResult(result, { exitCode: 1, usageError: 'features: missing value' });
      assertNoFile(fsMock.experimentalFeaturesFilePath());
    });

    it('with an unknown feature, should fail and write nothing', async () => {
      const result = await runClever(['features', 'enable', 'foo']);

      assertCleverResult(result, { exitCode: 1, stderrText: '[ERROR] Unavailable feature(s): foo' });
      assertNoFile(fsMock.experimentalFeaturesFilePath());
    });

    it('with a known and an unknown feature, should fail before enabling the known one', async () => {
      const result = await runClever(['features', 'enable', 'k8s,foo']);

      assertCleverResult(result, { exitCode: 1, stderrText: '[ERROR] Unavailable feature(s): foo' });
      assertNoFile(fsMock.experimentalFeaturesFilePath());
    });

    it('with several unknown features, should list them all in the order given', async () => {
      const result = await runClever(['features', 'enable', 'foo,k8s,bar']);

      assertCleverResult(result, { exitCode: 1, stderrText: '[ERROR] Unavailable feature(s): foo, bar' });
      assertNoFile(fsMock.experimentalFeaturesFilePath());
    });

    it('with a feature name in another case, should fail', async () => {
      const result = await runClever(['features', 'enable', 'K8S']);

      assertCleverResult(result, { exitCode: 1, stderrText: '[ERROR] Unavailable feature(s): K8S' });
      assertNoFile(fsMock.experimentalFeaturesFilePath());
    });

    it('with a space after the comma, should fail with the name kept as typed', async () => {
      const result = await runClever(['features', 'enable', 'k8s, ng']);

      // The unknown name is " ng", with its leading space.
      assertCleverResult(result, { exitCode: 1, stderrText: '[ERROR] Unavailable feature(s):  ng' });
      assertNoFile(fsMock.experimentalFeaturesFilePath());
    });

    it('with a trailing comma, should fail on the empty name', async () => {
      const result = await runClever(['features', 'enable', 'k8s,']);

      // The unknown name is the empty string: the line ends with a space, trimmed by runCli().
      assertCleverResult(result, { exitCode: 1, stderrText: '[ERROR] Unavailable feature(s):' });
      assertNoFile(fsMock.experimentalFeaturesFilePath());
    });
  });

  describe('Environment errors', () => {
    it('with an experimental features file that is not writable, should fail', async () => {
      // A directory in place of the experimental features file makes the write fail.
      fsMock.write('config/clever-tools-experimental-features.json/placeholder', '');

      const result = await runClever(['features', 'enable', 'k8s']);

      assertCleverResult(result, {
        exitCode: 1,
        stderrText: `[ERROR] Cannot write experimental features configuration to ${fsMock.experimentalFeaturesFilePath()}`,
      });
    });

    it('with an experimental features file holding an invalid value, should replace the file content', async () => {
      // The file is ignored as a whole when one value is not a boolean: k8s is lost too.
      fsMock.writeExperimentalFeaturesFile({ ng: 'yes', k8s: true });

      const result = await runClever(['features', 'enable', 'operators']);

      assertCleverResult(result, {
        exitCode: 0,
        stdoutText: `
          Experimental feature 'operators' enabled
          clever keycloak
          clever keycloak get keycloak_xxx
          clever keycloak ng enable myKeycloak

          clever metabase version check myMetabase
          clever metabase version update myMetabase 0.53

          clever matomo open myMatomo
          clever otoroshi open logs myOtoroshi
        `,
      });
      assertJsonFile(fsMock.experimentalFeaturesFilePath(), { operators: true });
    });
  });
});
