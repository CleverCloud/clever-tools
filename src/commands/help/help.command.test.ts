import { describe, it } from 'node:test';
import { assertCleverResult } from '../../../test/assert-clever-result.ts';
import { setupCleverSandbox } from '../../../test/setup-clever-sandbox.ts';

describe('clever help', () => {
  const { fsMock, runClever } = setupCleverSandbox();

  describe('Happy path', () => {
    it('should print the root help and exit with code 0', async () => {
      const result = await runClever(['help']);

      assertCleverResult(result, {
        exitCode: 0,
        stdoutText: `
          CLI tool to manage Clever Cloud's data and products

          USAGE
            clever [options]

          COMMANDS
            accesslogs               Fetch access logs
            activity                 Show last deployments of an application
            addon                    Manage add-ons
            applications             List linked applications
            cancel-deploy            Cancel an ongoing deployment
            config                   Display or edit the configuration of your application
            config-provider          Manage configuration providers
            console                  Open an application in the Console
            create                   Create an application
            curl                     Query Clever Cloud's API using Clever Tools credentials
            database                 Manage databases and backups
            delete                   Delete an application
            deploy                   Deploy an application
            diag                     Diagnose the current installation (prints various informations for support)
            domain                   Manage domain names for an application
            drain                    Manage drains
            emails                   Manage email addresses of the current user
            env                      Manage environment variables of an application
            features                 Manage Clever Tools experimental features
            help                     Display help about the Clever Cloud CLI
            instances                List instances of an application
            kv                       Send a raw command to a Materia KV or Redis® add-on
            link                     Link this repo to an existing application
            login                    Login to Clever Cloud
            logout                   Logout from Clever Cloud
            logs                     Fetch application logs, continuously
            make-default             Make a linked application the default one
            notify-email             Manage email notifications
            oauth-consumers          Manage OAuth consumers used with a Clever Cloud login
            open                     Open an application in the Console
            profile                  Display the profile of the current user
            published-config         Manage the configuration made available to other applications by this application
            restart                  Start or restart an application
            scale                    Change scalability of an application
            service                  Manage service dependencies
            ssh                      Connect to running instances through SSH
            ssh-keys                 Manage SSH keys of the current user
            status                   See the status of an application
            stop                     Stop a running application
            tcp-redirs               Control the TCP redirections from reverse proxies to your application
            tokens                   Manage API tokens to query Clever Cloud API from http://127.0.0.1:2
            unlink                   Unlink this repo from an existing application
            version                  Display the clever-tools version
            webhooks                 Manage webhooks

          OPTIONS
                --color              Choose whether to print colors or not. You can also use --no-color (default: true)
            -?, --help               Display help about this program
                --update-notifier    Choose whether to use update notifier or not. You can also use --no-update-notifier (default: true)
            -v, --verbose            Verbose output
            -V, --version            Display the version of this program
        `,
      });
    });

    it('with a command name, should print the help of this command', async () => {
      const result = await runClever(['help', 'env', 'set']);

      assertCleverResult(result, {
        exitCode: 0,
        stdoutText: `
          Add or update an environment variable named <variable-name> with the value <variable-value>

          USAGE
            clever env set <variable-name> <variable-value> [options]

          ARGUMENTS
            variable-name                  Name of the environment variable
            variable-value                 Value of the environment variable

          OPTIONS
            -a, --alias <alias>            Short name for the application
                --app <app-id|app-name>    Application to manage by its ID (or name, if unambiguous)
        `,
      });
    });

    it('with a group command name, should print its help with the subcommands', async () => {
      const result = await runClever(['help', 'drain', 'create']);

      assertCleverResult(result, {
        exitCode: 0,
        stdoutText: `
          Create a drain

          USAGE
            clever drain create

          COMMANDS
            betterstack      Create a Better Stack drain
            datadog          Create a Datadog drain
            elasticsearch    Create an Elasticsearch drain
            newrelic         Create a New Relic drain
            ovh-tcp          Create an OVH TCP drain
            raw-http         Create a raw HTTP drain
            sekoia           Create a Sekoia.io drain
            splunk           Create a Splunk HEC drain
            syslog-tcp       Create a Syslog TCP drain
            syslog-udp       Create a Syslog UDP drain
        `,
      });
    });

    it('with an unknown command name, should print the root help and exit with code 0', async () => {
      const result = await runClever(['help', 'unknown']);

      assertCleverResult(result, {
        exitCode: 0,
        stdoutText: `
          CLI tool to manage Clever Cloud's data and products

          USAGE
            clever [options]

          COMMANDS
            accesslogs               Fetch access logs
            activity                 Show last deployments of an application
            addon                    Manage add-ons
            applications             List linked applications
            cancel-deploy            Cancel an ongoing deployment
            config                   Display or edit the configuration of your application
            config-provider          Manage configuration providers
            console                  Open an application in the Console
            create                   Create an application
            curl                     Query Clever Cloud's API using Clever Tools credentials
            database                 Manage databases and backups
            delete                   Delete an application
            deploy                   Deploy an application
            diag                     Diagnose the current installation (prints various informations for support)
            domain                   Manage domain names for an application
            drain                    Manage drains
            emails                   Manage email addresses of the current user
            env                      Manage environment variables of an application
            features                 Manage Clever Tools experimental features
            help                     Display help about the Clever Cloud CLI
            instances                List instances of an application
            kv                       Send a raw command to a Materia KV or Redis® add-on
            link                     Link this repo to an existing application
            login                    Login to Clever Cloud
            logout                   Logout from Clever Cloud
            logs                     Fetch application logs, continuously
            make-default             Make a linked application the default one
            notify-email             Manage email notifications
            oauth-consumers          Manage OAuth consumers used with a Clever Cloud login
            open                     Open an application in the Console
            profile                  Display the profile of the current user
            published-config         Manage the configuration made available to other applications by this application
            restart                  Start or restart an application
            scale                    Change scalability of an application
            service                  Manage service dependencies
            ssh                      Connect to running instances through SSH
            ssh-keys                 Manage SSH keys of the current user
            status                   See the status of an application
            stop                     Stop a running application
            tcp-redirs               Control the TCP redirections from reverse proxies to your application
            tokens                   Manage API tokens to query Clever Cloud API from http://127.0.0.1:2
            unlink                   Unlink this repo from an existing application
            version                  Display the clever-tools version
            webhooks                 Manage webhooks

          OPTIONS
                --color              Choose whether to print colors or not. You can also use --no-color (default: true)
            -?, --help               Display help about this program
                --update-notifier    Choose whether to use update notifier or not. You can also use --no-update-notifier (default: true)
            -v, --verbose            Verbose output
            -V, --version            Display the version of this program
        `,
      });
    });

    it('with a command name followed by an unknown word, should print the help of the command', async () => {
      const result = await runClever(['help', 'env', 'unknown']);

      assertCleverResult(result, {
        exitCode: 0,
        stdoutText: `
          Manage environment variables of an application

          USAGE
            clever env [options]

          COMMANDS
            import                         Load environment variables from STDIN
            import-vars                    Add or update environment variables named <variable-names> (comma-separated), taking their values from the current environment
            rm                             Remove an environment variable from an application
            set                            Add or update an environment variable named <variable-name> with the value <variable-value>

          OPTIONS
                --add-export               Display sourceable env variables setting (deprecated, use \`--format shell\` instead)
            -a, --alias <alias>            Short name for the application
                --app <app-id|app-name>    Application to manage by its ID (or name, if unambiguous)
            -F, --format <format>          Output format (human, json, shell) (default: human)
        `,
      });
    });

    it('with help as command name, should print the help of the help command', async () => {
      const result = await runClever(['help', 'help']);

      assertCleverResult(result, {
        exitCode: 0,
        stdoutText: `
          Display help about the Clever Cloud CLI

          USAGE
            clever help
        `,
      });
    });

    it('with --help, should print the same help as without', async () => {
      const result = await runClever(['help', '--help']);

      assertCleverResult(result, {
        exitCode: 0,
        stdoutText: `
          Display help about the Clever Cloud CLI

          USAGE
            clever help
        `,
      });
    });

    it('with the experimental features enabled, should list their commands with a [BETA] suffix', async () => {
      fsMock.writeExperimentalFeaturesFile({ k8s: true, ng: true, operators: true });

      const result = await runClever(['help']);

      assertCleverResult(result, {
        exitCode: 0,
        stdoutText: `
          CLI tool to manage Clever Cloud's data and products

          USAGE
            clever [options]

          COMMANDS
            accesslogs               Fetch access logs
            activity                 Show last deployments of an application
            addon                    Manage add-ons
            applications             List linked applications
            cancel-deploy            Cancel an ongoing deployment
            config                   Display or edit the configuration of your application
            config-provider          Manage configuration providers
            console                  Open an application in the Console
            create                   Create an application
            curl                     Query Clever Cloud's API using Clever Tools credentials
            database                 Manage databases and backups
            delete                   Delete an application
            deploy                   Deploy an application
            diag                     Diagnose the current installation (prints various informations for support)
            domain                   Manage domain names for an application
            drain                    Manage drains
            emails                   Manage email addresses of the current user
            env                      Manage environment variables of an application
            features                 Manage Clever Tools experimental features
            help                     Display help about the Clever Cloud CLI
            instances                List instances of an application
            k8s                      Manage Kubernetes clusters [BETA]
            keycloak                 Manage Clever Cloud Keycloak services [BETA]
            kv                       Send a raw command to a Materia KV or Redis® add-on
            link                     Link this repo to an existing application
            login                    Login to Clever Cloud
            logout                   Logout from Clever Cloud
            logs                     Fetch application logs, continuously
            make-default             Make a linked application the default one
            matomo                   Manage Clever Cloud Matomo services [BETA]
            metabase                 Manage Clever Cloud Metabase services [BETA]
            ng                       List Network Groups [BETA]
            notify-email             Manage email notifications
            oauth-consumers          Manage OAuth consumers used with a Clever Cloud login
            open                     Open an application in the Console
            otoroshi                 Manage Clever Cloud Otoroshi services [BETA]
            profile                  Display the profile of the current user
            published-config         Manage the configuration made available to other applications by this application
            restart                  Start or restart an application
            scale                    Change scalability of an application
            service                  Manage service dependencies
            ssh                      Connect to running instances through SSH
            ssh-keys                 Manage SSH keys of the current user
            status                   See the status of an application
            stop                     Stop a running application
            tcp-redirs               Control the TCP redirections from reverse proxies to your application
            tokens                   Manage API tokens to query Clever Cloud API from http://127.0.0.1:2
            unlink                   Unlink this repo from an existing application
            version                  Display the clever-tools version
            webhooks                 Manage webhooks

          OPTIONS
                --color              Choose whether to print colors or not. You can also use --no-color (default: true)
            -?, --help               Display help about this program
                --update-notifier    Choose whether to use update notifier or not. You can also use --no-update-notifier (default: true)
            -v, --verbose            Verbose output
            -V, --version            Display the version of this program
        `,
      });
    });

    it('with a command behind an experimental feature not enabled, should print the root help', async () => {
      const result = await runClever(['help', 'k8s']);

      assertCleverResult(result, {
        exitCode: 0,
        stdoutText: `
          CLI tool to manage Clever Cloud's data and products

          USAGE
            clever [options]

          COMMANDS
            accesslogs               Fetch access logs
            activity                 Show last deployments of an application
            addon                    Manage add-ons
            applications             List linked applications
            cancel-deploy            Cancel an ongoing deployment
            config                   Display or edit the configuration of your application
            config-provider          Manage configuration providers
            console                  Open an application in the Console
            create                   Create an application
            curl                     Query Clever Cloud's API using Clever Tools credentials
            database                 Manage databases and backups
            delete                   Delete an application
            deploy                   Deploy an application
            diag                     Diagnose the current installation (prints various informations for support)
            domain                   Manage domain names for an application
            drain                    Manage drains
            emails                   Manage email addresses of the current user
            env                      Manage environment variables of an application
            features                 Manage Clever Tools experimental features
            help                     Display help about the Clever Cloud CLI
            instances                List instances of an application
            kv                       Send a raw command to a Materia KV or Redis® add-on
            link                     Link this repo to an existing application
            login                    Login to Clever Cloud
            logout                   Logout from Clever Cloud
            logs                     Fetch application logs, continuously
            make-default             Make a linked application the default one
            notify-email             Manage email notifications
            oauth-consumers          Manage OAuth consumers used with a Clever Cloud login
            open                     Open an application in the Console
            profile                  Display the profile of the current user
            published-config         Manage the configuration made available to other applications by this application
            restart                  Start or restart an application
            scale                    Change scalability of an application
            service                  Manage service dependencies
            ssh                      Connect to running instances through SSH
            ssh-keys                 Manage SSH keys of the current user
            status                   See the status of an application
            stop                     Stop a running application
            tcp-redirs               Control the TCP redirections from reverse proxies to your application
            tokens                   Manage API tokens to query Clever Cloud API from http://127.0.0.1:2
            unlink                   Unlink this repo from an existing application
            version                  Display the clever-tools version
            webhooks                 Manage webhooks

          OPTIONS
                --color              Choose whether to print colors or not. You can also use --no-color (default: true)
            -?, --help               Display help about this program
                --update-notifier    Choose whether to use update notifier or not. You can also use --no-update-notifier (default: true)
            -v, --verbose            Verbose output
            -V, --version            Display the version of this program
        `,
      });
    });
  });
});
