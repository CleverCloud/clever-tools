import { getSummary } from '@clevercloud/client/esm/api/v2/user.js';
import { formatTable } from '../../format-table.js';
import { defineCommand } from '../../lib/define-command.js';
import { styleText } from '../../lib/style-text.js';
import { formatTagsFilter, getTagsFromSummary, hasAllTags } from '../../lib/tags.js';
import { Logger } from '../../logger.js';
import * as Application from '../../models/application.js';
import * as CleverJson from '../../models/clever-json.js';
import * as Organisation from '../../models/organisation.js';
import { sendToApi } from '../../models/send-to-api.js';
import { truncateWithEllipsis } from '../../models/utils.js';
import { humanJsonOutputFormatOption, orgaIdOrNameOption, tagsFilterOption } from '../global.options.js';

function getPropertyMaxWidth(array, propertyName) {
  return Math.max(...array.map((o) => o[propertyName].length));
}

export const applicationsListCommand = defineCommand({
  description: 'List all applications',
  since: '3.8.0',
  options: {
    org: orgaIdOrNameOption,
    format: humanJsonOutputFormatOption,
    tags: { ...tagsFilterOption, featureFlag: 'tags' },
  },
  args: [],
  async handler(options) {
    const { org: orgaIdOrName, format, tags } = options;

    const linkedApps = await CleverJson.loadApplicationConf().then((conf) => conf.apps);

    const ownerId =
      orgaIdOrName != null && orgaIdOrName.orga_name !== '' ? await Organisation.getId(orgaIdOrName) : null;

    // Read once: it lists the owners of the applications and, for the tag filter, their tags
    const summary = await getSummary().then(sendToApi);
    let allAppsPerOrg = await Application.getAllApps(ownerId, summary);
    if (tags != null) {
      const tagsPerAppId = (await getTagsFromSummary(summary)).applications;
      allAppsPerOrg = allAppsPerOrg
        .map((org) => ({
          ...org,
          applications: org.applications.filter((app) => hasAllTags(tagsPerAppId.get(app.app_id) ?? [], tags)),
        }))
        // With a tag filter, an owner without any matching application is noise
        .filter((org) => org.applications.length > 0);
    }

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
        if (tags != null && allAppsWithAliasPerOrg.length === 0) {
          Logger.println(`🔎 No application found with the ${formatTagsFilter(tags)}`);
          break;
        }

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
