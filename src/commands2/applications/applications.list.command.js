import { formatTable } from '../../format-table.js';
import { defineCommand } from '../../lib/define-command.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import * as AppConfig from '../../models/app_configuration.js';
import * as Application from '../../models/application.js';
import * as Organisation from '../../models/organisation.js';
import { truncateWithEllipsis } from '../../models/utils.js';
import { humanJsonOutputFormatFlag, orgaIdOrNameFlag } from '../global.flags.js';

function getPropertyMaxWidth(array, propertyName) {
  return Math.max(...array.map((o) => o[propertyName].length));
}

export const applicationsListCommand = defineCommand({
  description: 'List all applications',
  flags: {
    org: orgaIdOrNameFlag,
    format: humanJsonOutputFormatFlag,
  },
  args: [],
  async handler(flags) {
    const { org: orgaIdOrName, format } = flags;

    const linkedApps = await AppConfig.loadApplicationConf().then((conf) => conf.apps);

    const ownerId =
      orgaIdOrName != null && orgaIdOrName.orga_name !== '' ? await Organisation.getId(orgaIdOrName) : null;

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
              formatTable(
                [
                  headers,
                  ...org.applications.map((app) => [
                    app.app_id,
                    truncateWithEllipsis(appNameWidth, app.name),
                    app.type,
                    app.zone,
                    app.alias,
                  ]),
                ],

                columnWidths,
              ),
            );
          }
        });

        break;
      }
    }
  },
});
