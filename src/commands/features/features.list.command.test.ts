import { describe, it } from 'node:test';
import { assertCleverResult } from '../../../test/assert-clever-result.ts';
import { assertNoFile } from '../../../test/lib/fs/assert-file.ts';
import { setupCleverSandbox } from '../../../test/setup-clever-sandbox.ts';

describe('clever features list', () => {
  const { fsMock, runClever } = setupCleverSandbox();

  describe('Happy path', () => {
    describe('with no experimental features file', () => {
      it('should list the features with their defaults in human format', async () => {
        const result = await runClever(['features', 'list']);

        assertCleverResult(result, {
          exitCode: 0,
          stdoutText: `
            ID          STATUS  DESCRIPTION                                                                                        ENABLED
            system-git  stable  Use system git instead of the pure JS implementation for git operations                            true
            k8s         beta    Deploy and manage Kubernetes clusters on Clever Cloud                                              false
            ng          beta    Manage Network Groups to manage applications, add-ons, external peers through a WireGuard network  false
            operators   beta    Manage operators and their features such as Keycloak, Matomo, Metabase, Otoroshi                   false
          `,
        });
        assertNoFile(fsMock.experimentalFeaturesFilePath());
      });

      it('should list the features with their defaults in json format', async () => {
        const result = await runClever(['features', 'list', '--format', 'json']);

        assertCleverResult(result, {
          exitCode: 0,
          stdoutText: `
            [
              {
                "id": "system-git",
                "status": "stable",
                "description": "Use system git instead of the pure JS implementation for git operations",
                "enabled": true
              },
              {
                "id": "k8s",
                "status": "beta",
                "description": "Deploy and manage Kubernetes clusters on Clever Cloud",
                "enabled": false
              },
              {
                "id": "ng",
                "status": "beta",
                "description": "Manage Network Groups to manage applications, add-ons, external peers through a WireGuard network",
                "enabled": false
              },
              {
                "id": "operators",
                "status": "beta",
                "description": "Manage operators and their features such as Keycloak, Matomo, Metabase, Otoroshi",
                "enabled": false
              }
            ]
          `,
        });
      });
    });

    describe('with k8s and ng enabled and system-git disabled in the experimental features file', () => {
      it('should print the explicit values in human format', async () => {
        fsMock.writeExperimentalFeaturesFile({ 'system-git': false, k8s: true, ng: true });

        const result = await runClever(['features', 'list']);

        assertCleverResult(result, {
          exitCode: 0,
          stdoutText: `
            ID          STATUS  DESCRIPTION                                                                                        ENABLED
            system-git  stable  Use system git instead of the pure JS implementation for git operations                            false
            k8s         beta    Deploy and manage Kubernetes clusters on Clever Cloud                                              true
            ng          beta    Manage Network Groups to manage applications, add-ons, external peers through a WireGuard network  true
            operators   beta    Manage operators and their features such as Keycloak, Matomo, Metabase, Otoroshi                   false
          `,
        });
      });

      it('should print the explicit values in json format', async () => {
        fsMock.writeExperimentalFeaturesFile({ 'system-git': false, k8s: true, ng: true });

        const result = await runClever(['features', 'list', '--format', 'json']);

        assertCleverResult(result, {
          exitCode: 0,
          stdoutJson: [
            {
              id: 'system-git',
              status: 'stable',
              description: 'Use system git instead of the pure JS implementation for git operations',
              enabled: false,
            },
            {
              id: 'k8s',
              status: 'beta',
              description: 'Deploy and manage Kubernetes clusters on Clever Cloud',
              enabled: true,
            },
            {
              id: 'ng',
              status: 'beta',
              description:
                'Manage Network Groups to manage applications, add-ons, external peers through a WireGuard network',
              enabled: true,
            },
            {
              id: 'operators',
              status: 'beta',
              description: 'Manage operators and their features such as Keycloak, Matomo, Metabase, Otoroshi',
              enabled: false,
            },
          ],
        });
      });
    });

    describe('with all the features enabled in the experimental features file', () => {
      it('should print every feature as enabled in human format', async () => {
        fsMock.writeExperimentalFeaturesFile({ 'system-git': true, k8s: true, ng: true, operators: true });

        const result = await runClever(['features', 'list']);

        assertCleverResult(result, {
          exitCode: 0,
          stdoutText: `
            ID          STATUS  DESCRIPTION                                                                                        ENABLED
            system-git  stable  Use system git instead of the pure JS implementation for git operations                            true
            k8s         beta    Deploy and manage Kubernetes clusters on Clever Cloud                                              true
            ng          beta    Manage Network Groups to manage applications, add-ons, external peers through a WireGuard network  true
            operators   beta    Manage operators and their features such as Keycloak, Matomo, Metabase, Otoroshi                   true
          `,
        });
      });

      it('should print every feature as enabled in json format', async () => {
        fsMock.writeExperimentalFeaturesFile({ 'system-git': true, k8s: true, ng: true, operators: true });

        const result = await runClever(['features', 'list', '--format', 'json']);

        assertCleverResult(result, {
          exitCode: 0,
          stdoutJson: [
            {
              id: 'system-git',
              status: 'stable',
              description: 'Use system git instead of the pure JS implementation for git operations',
              enabled: true,
            },
            {
              id: 'k8s',
              status: 'beta',
              description: 'Deploy and manage Kubernetes clusters on Clever Cloud',
              enabled: true,
            },
            {
              id: 'ng',
              status: 'beta',
              description:
                'Manage Network Groups to manage applications, add-ons, external peers through a WireGuard network',
              enabled: true,
            },
            {
              id: 'operators',
              status: 'beta',
              description: 'Manage operators and their features such as Keycloak, Matomo, Metabase, Otoroshi',
              enabled: true,
            },
          ],
        });
      });
    });

    it('with an empty experimental features file, should print the defaults', async () => {
      fsMock.writeExperimentalFeaturesFile({});

      const result = await runClever(['features', 'list']);

      assertCleverResult(result, {
        exitCode: 0,
        stdoutText: `
          ID          STATUS  DESCRIPTION                                                                                        ENABLED
          system-git  stable  Use system git instead of the pure JS implementation for git operations                            true
          k8s         beta    Deploy and manage Kubernetes clusters on Clever Cloud                                              false
          ng          beta    Manage Network Groups to manage applications, add-ons, external peers through a WireGuard network  false
          operators   beta    Manage operators and their features such as Keycloak, Matomo, Metabase, Otoroshi                   false
        `,
      });
    });

    it('with an experimental features file holding an unknown feature, should ignore it', async () => {
      fsMock.writeExperimentalFeaturesFile({ k8s: true, unknown: true });

      const result = await runClever(['features', 'list']);

      assertCleverResult(result, {
        exitCode: 0,
        stdoutText: `
          ID          STATUS  DESCRIPTION                                                                                        ENABLED
          system-git  stable  Use system git instead of the pure JS implementation for git operations                            true
          k8s         beta    Deploy and manage Kubernetes clusters on Clever Cloud                                              true
          ng          beta    Manage Network Groups to manage applications, add-ons, external peers through a WireGuard network  false
          operators   beta    Manage operators and their features such as Keycloak, Matomo, Metabase, Otoroshi                   false
        `,
      });
    });
  });

  describe('Environment errors', () => {
    it('with an experimental features file that is not valid JSON, should print the defaults', async () => {
      fsMock.writeExperimentalFeaturesFile('{ not json');

      const result = await runClever(['features', 'list']);

      assertCleverResult(result, {
        exitCode: 0,
        stdoutText: `
          ID          STATUS  DESCRIPTION                                                                                        ENABLED
          system-git  stable  Use system git instead of the pure JS implementation for git operations                            true
          k8s         beta    Deploy and manage Kubernetes clusters on Clever Cloud                                              false
          ng          beta    Manage Network Groups to manage applications, add-ons, external peers through a WireGuard network  false
          operators   beta    Manage operators and their features such as Keycloak, Matomo, Metabase, Otoroshi                   false
        `,
      });
    });

    it('with an experimental features file holding a non boolean value, should print the defaults', async () => {
      // The whole file is ignored: ng stays disabled.
      fsMock.writeExperimentalFeaturesFile({ k8s: 'yes', ng: true });

      const result = await runClever(['features', 'list']);

      assertCleverResult(result, {
        exitCode: 0,
        stdoutText: `
          ID          STATUS  DESCRIPTION                                                                                        ENABLED
          system-git  stable  Use system git instead of the pure JS implementation for git operations                            true
          k8s         beta    Deploy and manage Kubernetes clusters on Clever Cloud                                              false
          ng          beta    Manage Network Groups to manage applications, add-ons, external peers through a WireGuard network  false
          operators   beta    Manage operators and their features such as Keycloak, Matomo, Metabase, Otoroshi                   false
        `,
      });
    });

    it('with an experimental features file holding null, should print the defaults', async () => {
      fsMock.writeExperimentalFeaturesFile('null');

      const result = await runClever(['features', 'list']);

      assertCleverResult(result, {
        exitCode: 0,
        stdoutText: `
          ID          STATUS  DESCRIPTION                                                                                        ENABLED
          system-git  stable  Use system git instead of the pure JS implementation for git operations                            true
          k8s         beta    Deploy and manage Kubernetes clusters on Clever Cloud                                              false
          ng          beta    Manage Network Groups to manage applications, add-ons, external peers through a WireGuard network  false
          operators   beta    Manage operators and their features such as Keycloak, Matomo, Metabase, Otoroshi                   false
        `,
      });
    });
  });
});
