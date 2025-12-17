import { getBackups } from '@clevercloud/client/esm/api/v2/backups.js';
import { formatTable } from '../../format-table.js';
import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import { findOwnerId } from '../../models/addon.js';
import { resolveAddonId, resolveRealId } from '../../models/ids-resolver.js';
import { sendToApi } from '../../models/send-to-api.js';
import { humanJsonOutputFormatOption, orgaIdOrNameOption } from '../global.options.js';
import { databaseIdArg } from './database.args.js';

export const databaseBackupsCommand = defineCommand({
  description: 'List available database backups',
  since: '2.10.0',
  sinceDate: '2023-02-16',
  options: {
    org: orgaIdOrNameOption,
    format: humanJsonOutputFormatOption,
  },
  args: [databaseIdArg],
  async handler(options, addonIdOrRealId) {
    const { org, format } = options;

    const realId = await resolveRealId(addonIdOrRealId);
    const addonId = await resolveAddonId(addonIdOrRealId);
    const ownerId = await findOwnerId(org, realId);

    const backups = await getBackups({ ownerId, ref: realId }).then(sendToApi);

    if (backups.length === 0 && format === 'human') {
      Logger.println('There are no backups yet');
      return;
    }

    const sortedBackups = backups.sort((a, b) => a.creation_date.localeCompare(b.creation_date));

    switch (format) {
      case 'json': {
        const formattedBackups = sortedBackups.map((backup) => {
          return {
            addonId: addonId,
            backupId: backup.backup_id,
            creationDate: backup.creation_date,
            downloadUrl: backup.download_url,
            ownerId: ownerId,
            realId: realId,
            status: backup.status,
          };
        });
        Logger.printJson(formattedBackups);
        break;
      }
      case 'human': {
        const formattedLines = sortedBackups.map((backup) => [backup.backup_id, backup.creation_date, backup.status]);

        const head = ['BACKUP ID', 'CREATION DATE', 'STATUS'];

        Logger.println(formatTable([head, ...formattedLines]));
      }
    }
  },
});
