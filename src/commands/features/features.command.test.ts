import { describe, it } from 'node:test';
import { assertCleverResult } from '../../../test/assert-clever-result.ts';
import { assertNoFile } from '../../../test/lib/fs/assert-file.ts';
import { setupCleverSandbox } from '../../../test/setup-clever-sandbox.ts';

describe('clever features', () => {
  // `clever features` is `clever features list` with another description: the variants of the experimental features
  // file are tested in features.list.command.test.ts, only the alias and the help are tested here.
  const { fsMock, runClever } = setupCleverSandbox();

  describe('Happy path', () => {
    describe('with no experimental features file', () => {
      it('should list the features with their defaults in human format', async () => {
        const result = await runClever(['features']);

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
        const result = await runClever(['features', '--format', 'json']);

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
              enabled: false,
            },
            {
              id: 'ng',
              status: 'beta',
              description:
                'Manage Network Groups to manage applications, add-ons, external peers through a WireGuard network',
              enabled: false,
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

    it('with k8s enabled in the experimental features file, should list it as enabled', async () => {
      fsMock.writeExperimentalFeaturesFile({ k8s: true });

      const result = await runClever(['features']);

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

    it('with --help, should print the help of the subcommands', async () => {
      const result = await runClever(['features', '--help']);

      assertCleverResult(result, {
        exitCode: 0,
        stdoutText: `
          Manage Clever Tools experimental features

          USAGE
            clever features [options]

          COMMANDS
            disable                  Disable experimental features
            enable                   Enable experimental features
            info                     Display info about an experimental feature
            list                     List available experimental features

          OPTIONS
            -F, --format <format>    Output format (human, json) (default: human)
        `,
      });
    });
  });
});
