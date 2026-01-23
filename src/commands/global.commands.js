import { accesslogsCommand } from './accesslogs/accesslogs.command.js';
import { activityCommand } from './activity/activity.command.js';
import { addonCommand } from './addon/addon.command.js';
import { addonCreateCommand } from './addon/addon.create.command.js';
import { addonDeleteCommand } from './addon/addon.delete.command.js';
import { addonEnvCommand } from './addon/addon.env.command.js';
import { addonListCommand } from './addon/addon.list.command.js';
import { addonProvidersCommand } from './addon/addon.providers.command.js';
import { addonProvidersShowCommand } from './addon/addon.providers.show.command.js';
import { addonRenameCommand } from './addon/addon.rename.command.js';
import { applicationsCommand } from './applications/applications.command.js';
import { applicationsListCommand } from './applications/applications.list.command.js';
import { cancelDeployCommand } from './cancel-deploy/cancel-deploy.command.js';
import { configProviderCommand } from './config-provider/config-provider.command.js';
import { configProviderGetCommand } from './config-provider/config-provider.get.command.js';
import { configProviderImportCommand } from './config-provider/config-provider.import.command.js';
import { configProviderListCommand } from './config-provider/config-provider.list.command.js';
import { configProviderOpenCommand } from './config-provider/config-provider.open.command.js';
import { configProviderRmCommand } from './config-provider/config-provider.rm.command.js';
import { configProviderSetCommand } from './config-provider/config-provider.set.command.js';
import { configCommand } from './config/config.command.js';
import { configGetCommand } from './config/config.get.command.js';
import { configSetCommand } from './config/config.set.command.js';
import { configUpdateCommand } from './config/config.update.command.js';
import { consoleCommand } from './console/console.command.js';
import { createCommand } from './create/create.command.js';
import { curlCommand } from './curl/curl.command.js';
import { databaseBackupsCommand } from './database/database.backups.command.js';
import { databaseBackupsDownloadCommand } from './database/database.backups.download.command.js';
import { databaseCommand } from './database/database.command.js';
import { deleteCommand } from './delete/delete.command.js';
import { deployCommand } from './deploy/deploy.command.js';
import { diagCommand } from './diag/diag.command.js';
import { domainAddCommand } from './domain/domain.add.command.js';
import { domainCommand } from './domain/domain.command.js';
import { domainDiagCommand } from './domain/domain.diag.command.js';
import { domainFavouriteCommand } from './domain/domain.favourite.command.js';
import { domainFavouriteSetCommand } from './domain/domain.favourite.set.command.js';
import { domainFavouriteUnsetCommand } from './domain/domain.favourite.unset.command.js';
import { domainOverviewCommand } from './domain/domain.overview.command.js';
import { domainRmCommand } from './domain/domain.rm.command.js';
import { drainCommand } from './drain/drain.command.js';
import { drainCreateCommand } from './drain/drain.create.command.js';
import { drainDisableCommand } from './drain/drain.disable.command.js';
import { drainEnableCommand } from './drain/drain.enable.command.js';
import { drainGetCommand } from './drain/drain.get.command.js';
import { drainRemoveCommand } from './drain/drain.remove.command.js';
import { emailsAddCommand } from './emails/emails.add.command.js';
import { emailsCommand } from './emails/emails.command.js';
import { emailsOpenCommand } from './emails/emails.open.command.js';
import { emailsPrimaryCommand } from './emails/emails.primary.command.js';
import { emailsRemoveAllCommand } from './emails/emails.remove-all.command.js';
import { emailsRemoveCommand } from './emails/emails.remove.command.js';
import { envCommand } from './env/env.command.js';
import { envImportVarsCommand } from './env/env.import-vars.command.js';
import { envImportCommand } from './env/env.import.command.js';
import { envRmCommand } from './env/env.rm.command.js';
import { envSetCommand } from './env/env.set.command.js';
import { featuresCommand } from './features/features.command.js';
import { featuresDisableCommand } from './features/features.disable.command.js';
import { featuresEnableCommand } from './features/features.enable.command.js';
import { featuresInfoCommand } from './features/features.info.command.js';
import { featuresListCommand } from './features/features.list.command.js';
import { helpCommand } from './help/help.command.js';
import { k8sAddPersistentStorageCommand } from './k8s/k8s.add-persistent-storage.command.js';
import { k8sCommand } from './k8s/k8s.command.js';
import { k8sCreateCommand } from './k8s/k8s.create.command.js';
import { k8sDeleteCommand } from './k8s/k8s.delete.command.js';
import { k8sGetKubeconfigCommand } from './k8s/k8s.get-kubeconfig.command.js';
import { k8sGetCommand } from './k8s/k8s.get.command.js';
import { k8sListCommand } from './k8s/k8s.list.command.js';
import { keycloakCommand } from './keycloak/keycloak.command.js';
import { keycloakDisableNgCommand } from './keycloak/keycloak.disable-ng.command.js';
import { keycloakEnableNgCommand } from './keycloak/keycloak.enable-ng.command.js';
import { keycloakGetCommand } from './keycloak/keycloak.get.command.js';
import { keycloakOpenCommand } from './keycloak/keycloak.open.command.js';
import { keycloakOpenLogsCommand } from './keycloak/keycloak.open.logs.command.js';
import { keycloakOpenWebuiCommand } from './keycloak/keycloak.open.webui.command.js';
import { keycloakRebuildCommand } from './keycloak/keycloak.rebuild.command.js';
import { keycloakRestartCommand } from './keycloak/keycloak.restart.command.js';
import { keycloakVersionCheckCommand } from './keycloak/keycloak.version.check.command.js';
import { keycloakVersionCommand } from './keycloak/keycloak.version.command.js';
import { keycloakVersionUpdateCommand } from './keycloak/keycloak.version.update.command.js';
import { kvCommand } from './kv/kv.command.js';
import { linkCommand } from './link/link.command.js';
import { loginCommand } from './login/login.command.js';
import { logoutCommand } from './logout/logout.command.js';
import { logsCommand } from './logs/logs.command.js';
import { makeDefaultCommand } from './make-default/make-default.command.js';
import { matomoCommand } from './matomo/matomo.command.js';
import { matomoGetCommand } from './matomo/matomo.get.command.js';
import { matomoOpenCommand } from './matomo/matomo.open.command.js';
import { matomoOpenLogsCommand } from './matomo/matomo.open.logs.command.js';
import { matomoOpenWebuiCommand } from './matomo/matomo.open.webui.command.js';
import { matomoRebuildCommand } from './matomo/matomo.rebuild.command.js';
import { matomoRestartCommand } from './matomo/matomo.restart.command.js';
import { metabaseCommand } from './metabase/metabase.command.js';
import { metabaseGetCommand } from './metabase/metabase.get.command.js';
import { metabaseOpenCommand } from './metabase/metabase.open.command.js';
import { metabaseOpenLogsCommand } from './metabase/metabase.open.logs.command.js';
import { metabaseOpenWebuiCommand } from './metabase/metabase.open.webui.command.js';
import { metabaseRebuildCommand } from './metabase/metabase.rebuild.command.js';
import { metabaseRestartCommand } from './metabase/metabase.restart.command.js';
import { metabaseVersionCheckCommand } from './metabase/metabase.version.check.command.js';
import { metabaseVersionCommand } from './metabase/metabase.version.command.js';
import { metabaseVersionUpdateCommand } from './metabase/metabase.version.update.command.js';
import { ngCommand } from './ng/ng.command.js';
import { ngCreateCommand } from './ng/ng.create.command.js';
import { ngCreateExternalCommand } from './ng/ng.create.external.command.js';
import { ngDeleteCommand } from './ng/ng.delete.command.js';
import { ngDeleteExternalCommand } from './ng/ng.delete.external.command.js';
import { ngGetConfigCommand } from './ng/ng.get-config.command.js';
import { ngGetCommand } from './ng/ng.get.command.js';
import { ngLinkCommand } from './ng/ng.link.command.js';
import { ngSearchCommand } from './ng/ng.search.command.js';
import { ngUnlinkCommand } from './ng/ng.unlink.command.js';
import { notifyEmailAddCommand } from './notify-email/notify-email.add.command.js';
import { notifyEmailCommand } from './notify-email/notify-email.command.js';
import { notifyEmailRemoveCommand } from './notify-email/notify-email.remove.command.js';
import { openCommand } from './open/open.command.js';
import { otoroshiCommand } from './otoroshi/otoroshi.command.js';
import { otoroshiDisableNgCommand } from './otoroshi/otoroshi.disable-ng.command.js';
import { otoroshiEnableNgCommand } from './otoroshi/otoroshi.enable-ng.command.js';
import { otoroshiGetConfigCommand } from './otoroshi/otoroshi.get-config.command.js';
import { otoroshiGetCommand } from './otoroshi/otoroshi.get.command.js';
import { otoroshiOpenCommand } from './otoroshi/otoroshi.open.command.js';
import { otoroshiOpenLogsCommand } from './otoroshi/otoroshi.open.logs.command.js';
import { otoroshiOpenWebuiCommand } from './otoroshi/otoroshi.open.webui.command.js';
import { otoroshiRebuildCommand } from './otoroshi/otoroshi.rebuild.command.js';
import { otoroshiRestartCommand } from './otoroshi/otoroshi.restart.command.js';
import { otoroshiVersionCheckCommand } from './otoroshi/otoroshi.version.check.command.js';
import { otoroshiVersionCommand } from './otoroshi/otoroshi.version.command.js';
import { otoroshiVersionUpdateCommand } from './otoroshi/otoroshi.version.update.command.js';
import { profileCommand } from './profile/profile.command.js';
import { profileOpenCommand } from './profile/profile.open.command.js';
import { publishedConfigCommand } from './published-config/published-config.command.js';
import { publishedConfigImportCommand } from './published-config/published-config.import.command.js';
import { publishedConfigRmCommand } from './published-config/published-config.rm.command.js';
import { publishedConfigSetCommand } from './published-config/published-config.set.command.js';
import { restartCommand } from './restart/restart.command.js';
import { scaleCommand } from './scale/scale.command.js';
import { serviceCommand } from './service/service.command.js';
import { serviceLinkAddonCommand } from './service/service.link-addon.command.js';
import { serviceLinkAppCommand } from './service/service.link-app.command.js';
import { serviceUnlinkAddonCommand } from './service/service.unlink-addon.command.js';
import { serviceUnlinkAppCommand } from './service/service.unlink-app.command.js';
import { sshKeysAddCommand } from './ssh-keys/ssh-keys.add.command.js';
import { sshKeysCommand } from './ssh-keys/ssh-keys.command.js';
import { sshKeysOpenCommand } from './ssh-keys/ssh-keys.open.command.js';
import { sshKeysRemoveAllCommand } from './ssh-keys/ssh-keys.remove-all.command.js';
import { sshKeysRemoveCommand } from './ssh-keys/ssh-keys.remove.command.js';
import { sshCommand } from './ssh/ssh.command.js';
import { statusCommand } from './status/status.command.js';
import { stopCommand } from './stop/stop.command.js';
import { tcpRedirsAddCommand } from './tcp-redirs/tcp-redirs.add.command.js';
import { tcpRedirsCommand } from './tcp-redirs/tcp-redirs.command.js';
import { tcpRedirsListNamespacesCommand } from './tcp-redirs/tcp-redirs.list-namespaces.command.js';
import { tcpRedirsRemoveCommand } from './tcp-redirs/tcp-redirs.remove.command.js';
import { tokensCommand } from './tokens/tokens.command.js';
import { tokensCreateCommand } from './tokens/tokens.create.command.js';
import { tokensRevokeCommand } from './tokens/tokens.revoke.command.js';
import { unlinkCommand } from './unlink/unlink.command.js';
import { versionCommand } from './version/version.command.js';
import { webhooksAddCommand } from './webhooks/webhooks.add.command.js';
import { webhooksCommand } from './webhooks/webhooks.command.js';
import { webhooksRemoveCommand } from './webhooks/webhooks.remove.command.js';

export const globalCommands = {
  accesslogs: accesslogsCommand,
  activity: activityCommand,
  addon: [
    addonCommand,
    {
      create: addonCreateCommand,
      delete: addonDeleteCommand,
      env: addonEnvCommand,
      list: addonListCommand,
      providers: [
        addonProvidersCommand,
        {
          show: addonProvidersShowCommand,
        },
      ],
      rename: addonRenameCommand,
    },
  ],
  applications: [
    applicationsCommand,
    {
      list: applicationsListCommand,
    },
  ],
  'cancel-deploy': cancelDeployCommand,
  config: [
    configCommand,
    {
      get: configGetCommand,
      set: configSetCommand,
      update: configUpdateCommand,
    },
  ],
  'config-provider': [
    configProviderCommand,
    {
      get: configProviderGetCommand,
      import: configProviderImportCommand,
      list: configProviderListCommand,
      open: configProviderOpenCommand,
      rm: configProviderRmCommand,
      set: configProviderSetCommand,
    },
  ],
  console: consoleCommand,
  create: createCommand,
  curl: curlCommand,
  database: [
    databaseCommand,
    {
      backups: [
        databaseBackupsCommand,
        {
          download: databaseBackupsDownloadCommand,
        },
      ],
    },
  ],
  delete: deleteCommand,
  deploy: deployCommand,
  diag: diagCommand,
  domain: [
    domainCommand,
    {
      add: domainAddCommand,
      diag: domainDiagCommand,
      favourite: [
        domainFavouriteCommand,
        {
          set: domainFavouriteSetCommand,
          unset: domainFavouriteUnsetCommand,
        },
      ],
      overview: domainOverviewCommand,
      rm: domainRmCommand,
    },
  ],
  drain: [
    drainCommand,
    {
      create: drainCreateCommand,
      disable: drainDisableCommand,
      enable: drainEnableCommand,
      get: drainGetCommand,
      remove: drainRemoveCommand,
    },
  ],
  emails: [
    emailsCommand,
    {
      add: emailsAddCommand,
      open: emailsOpenCommand,
      primary: emailsPrimaryCommand,
      remove: emailsRemoveCommand,
      'remove-all': emailsRemoveAllCommand,
    },
  ],
  env: [
    envCommand,
    {
      import: envImportCommand,
      'import-vars': envImportVarsCommand,
      rm: envRmCommand,
      set: envSetCommand,
    },
  ],
  features: [
    featuresCommand,
    {
      disable: featuresDisableCommand,
      enable: featuresEnableCommand,
      info: featuresInfoCommand,
      list: featuresListCommand,
    },
  ],
  help: helpCommand,
  k8s: [
    k8sCommand,
    {
      'add-persistent-storage': k8sAddPersistentStorageCommand,
      create: k8sCreateCommand,
      delete: k8sDeleteCommand,
      get: k8sGetCommand,
      'get-kubeconfig': k8sGetKubeconfigCommand,
      list: k8sListCommand,
    },
  ],
  keycloak: [
    keycloakCommand,
    {
      'disable-ng': keycloakDisableNgCommand,
      'enable-ng': keycloakEnableNgCommand,
      get: keycloakGetCommand,
      open: [
        keycloakOpenCommand,
        {
          logs: keycloakOpenLogsCommand,
          webui: keycloakOpenWebuiCommand,
        },
      ],
      rebuild: keycloakRebuildCommand,
      restart: keycloakRestartCommand,
      version: [
        keycloakVersionCommand,
        {
          check: keycloakVersionCheckCommand,
          update: keycloakVersionUpdateCommand,
        },
      ],
    },
  ],
  kv: kvCommand,
  link: linkCommand,
  login: loginCommand,
  logout: logoutCommand,
  logs: logsCommand,
  'make-default': makeDefaultCommand,
  matomo: [
    matomoCommand,
    {
      get: matomoGetCommand,
      open: [
        matomoOpenCommand,
        {
          logs: matomoOpenLogsCommand,
          webui: matomoOpenWebuiCommand,
        },
      ],
      rebuild: matomoRebuildCommand,
      restart: matomoRestartCommand,
    },
  ],
  metabase: [
    metabaseCommand,
    {
      get: metabaseGetCommand,
      open: [
        metabaseOpenCommand,
        {
          logs: metabaseOpenLogsCommand,
          webui: metabaseOpenWebuiCommand,
        },
      ],
      rebuild: metabaseRebuildCommand,
      restart: metabaseRestartCommand,
      version: [
        metabaseVersionCommand,
        {
          check: metabaseVersionCheckCommand,
          update: metabaseVersionUpdateCommand,
        },
      ],
    },
  ],
  ng: [
    ngCommand,
    {
      create: [
        ngCreateCommand,
        {
          external: ngCreateExternalCommand,
        },
      ],
      delete: [
        ngDeleteCommand,
        {
          external: ngDeleteExternalCommand,
        },
      ],
      get: ngGetCommand,
      'get-config': ngGetConfigCommand,
      link: ngLinkCommand,
      search: ngSearchCommand,
      unlink: ngUnlinkCommand,
    },
  ],
  'notify-email': [
    notifyEmailCommand,
    {
      add: notifyEmailAddCommand,
      remove: notifyEmailRemoveCommand,
    },
  ],
  open: openCommand,
  otoroshi: [
    otoroshiCommand,
    {
      'disable-ng': otoroshiDisableNgCommand,
      'enable-ng': otoroshiEnableNgCommand,
      get: otoroshiGetCommand,
      'get-config': otoroshiGetConfigCommand,
      open: [
        otoroshiOpenCommand,
        {
          logs: otoroshiOpenLogsCommand,
          webui: otoroshiOpenWebuiCommand,
        },
      ],
      rebuild: otoroshiRebuildCommand,
      restart: otoroshiRestartCommand,
      version: [
        otoroshiVersionCommand,
        {
          check: otoroshiVersionCheckCommand,
          update: otoroshiVersionUpdateCommand,
        },
      ],
    },
  ],
  profile: [
    profileCommand,
    {
      open: profileOpenCommand,
    },
  ],
  'published-config': [
    publishedConfigCommand,
    {
      import: publishedConfigImportCommand,
      rm: publishedConfigRmCommand,
      set: publishedConfigSetCommand,
    },
  ],
  restart: restartCommand,
  scale: scaleCommand,
  service: [
    serviceCommand,
    {
      'link-addon': serviceLinkAddonCommand,
      'link-app': serviceLinkAppCommand,
      'unlink-addon': serviceUnlinkAddonCommand,
      'unlink-app': serviceUnlinkAppCommand,
    },
  ],
  ssh: sshCommand,
  'ssh-keys': [
    sshKeysCommand,
    {
      add: sshKeysAddCommand,
      open: sshKeysOpenCommand,
      remove: sshKeysRemoveCommand,
      'remove-all': sshKeysRemoveAllCommand,
    },
  ],
  status: statusCommand,
  stop: stopCommand,
  'tcp-redirs': [
    tcpRedirsCommand,
    {
      add: tcpRedirsAddCommand,
      'list-namespaces': tcpRedirsListNamespacesCommand,
      remove: tcpRedirsRemoveCommand,
    },
  ],
  tokens: [
    tokensCommand,
    {
      create: tokensCreateCommand,
      revoke: tokensRevokeCommand,
    },
  ],
  unlink: unlinkCommand,
  version: versionCommand,
  webhooks: [
    webhooksCommand,
    {
      add: webhooksAddCommand,
      remove: webhooksRemoveCommand,
    },
  ],
};
