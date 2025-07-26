import { styleText } from 'node:util';
import { formatTable } from '../format-table.js';
import { Logger } from '../logger.js';
import * as AppConfig from '../models/app_configuration.js';
import * as Application from '../models/application.js';
import * as Organisation from '../models/organisation.js';
import { truncateWithEllipsis } from '../models/utils.js';

export async function list(params) {
  const { 'only-aliases': onlyAliases, json } = params.options;

  const { apps } = await AppConfig.loadApplicationConf();

  const formattedApps = formatApps(apps, onlyAliases, json);
  Logger.println(formattedApps);
}

function formatApps(apps, onlyAliases, json) {
  if (json) {
    if (onlyAliases) {
      apps = apps.map((a) => a.alias);
    }
    return JSON.stringify(apps, null, 2);
  } else {
    if (onlyAliases) {
      return apps.map((a) => a.alias).join('\n');
    } else {
      return apps
        .map((app) => {
          const sshUrl = app.git_ssh_url ?? app.deploy_url.replace('https://', 'git+ssh://git@');
          return [
            `Application ${app.name}`,
            `  alias: ${styleText('bold', app.alias)}`,
            `  ID: ${app.app_id}`,
            `  deployment URL: ${app.deploy_url}`,
            `  git+ssh URL: ${sshUrl}`,
          ].join('\n');
        })
        .join('\n\n');
    }
  }
}

export async function listAll(params) {
  const { org: orgaIdOrName, format } = params.options;

  const linkedApps = await AppConfig.loadApplicationConf().then((conf) => conf.apps);

  const ownerId = orgaIdOrName != null && orgaIdOrName.orga_name !== '' ? await Organisation.getId(orgaIdOrName) : null;

  const allAppsPerOrg = await Application.getAllApps(ownerId);

  // For each app, we try to find a corresponding local alias in the configuration file
  const allAppsWithAliasPerOrg = allAppsPerOrg.map((org) => {
    const applicationsWithAlias = org.applications.map((app) => {
      const foundAlias = linkedApps.find((a) => a.app_id === app.app_id)?.alias;
      return { ...app, alias: foundAlias ?? '' };
    });
    return { ...org, applications: applicationsWithAlias };
  });

  switch (format) {
    case 'json': {
      Logger.printJson(allAppsWithAliasPerOrg);
      break;
    }
    case 'human':
    default: {
      const headers = ['APPLICATION ID', 'NAME', 'TYPE', 'ZONE', 'LOCAL ALIAS'];
      const appNameWidth = 42;

      // We calculate the maximum width of each column to format the table
      const allApps = allAppsWithAliasPerOrg.flatMap((org) => org.applications);
      const columnWidths = [
        getPropertyMaxWidth(allApps, 'app_id'),
        appNameWidth,
        getPropertyMaxWidth(allApps, 'type'),
        getPropertyMaxWidth(allApps, 'zone'),
        getPropertyMaxWidth(allApps, 'alias'),
      ];
      const formatTableWithColumnWidth = formatTable(columnWidths);

      allAppsWithAliasPerOrg.forEach((org) => {
        Logger.println();

        const applicationsPlural = org.applications.length !== 1 ? 'applications' : 'application';
        const punctuation = org.applications.length > 0 ? ':' : '';

        Logger.println(
          styleText(
            'blue',
            `• Organization '${org.name}' (${org.id}) with ${org.applications.length} ${applicationsPlural}${punctuation}`,
          ),
        );

        if (org.applications.length > 0) {
          Logger.println();
          Logger.println(
            formatTableWithColumnWidth([
              headers,
              ...org.applications.map((app) => [
                app.app_id,
                truncateWithEllipsis(appNameWidth, app.name),
                app.type,
                app.zone,
                app.alias,
              ]),
            ]),
          );
        }
      });

      break;
    }
  }
}

function getPropertyMaxWidth(array, propertyName) {
  return Math.max(...array.map((o) => o[propertyName].length));
}
