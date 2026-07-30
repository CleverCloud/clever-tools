import { ListBackupCommand } from '@clevercloud/client/cc-api-commands/backup/list-backup-command.js';
import { formatTable } from '../../format-table.js';
import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import { clients } from '../../models/cc-api-client.js';
import { resolveAddon } from '../../models/ids-resolver.js';
import { humanJsonOutputFormatOption, orgaIdOrNameOption } from '../global.options.js';
import { databaseIdArg } from './database.args.js';

export const databaseBackupsCommand = defineCommand({
  description: 'List available database backups',
  since: '2.10.0',
  options: {
    org: { ...orgaIdOrNameOption, deprecated: 'organisation is now resolved automatically' },
    format: humanJsonOutputFormatOption,
  },
  args: [databaseIdArg],
  async handler(options, addonIdOrRealId) {
    const { format } = options;

    const { ownerId, addonId, realId } = await resolveAddon(addonIdOrRealId);

    const backups = await clients.ccApi.send(new ListBackupCommand({ ownerId, addonId: realId }));

    if (backups.length === 0 && format === 'human') {
      Logger.println('There are no backups yet');
      return;
    }

    const sortedBackups = backups.sort((a, b) => a.createdAt.localeCompare(b.createdAt));

    switch (format) {
      case 'json': {
        const formattedBackups = sortedBackups.map((backup) => {
          return {
            addonId: addonId,
            backupId: backup.backupId,
            creationDate: backup.createdAt,
            downloadUrl: backup.downloadUrl,
            ownerId: ownerId,
            realId: realId,
            status: backup.status,
          };
        });
        Logger.printJson(formattedBackups);
        break;
      }
      case 'human': {
        const formattedLines = sortedBackups.map((backup) => [backup.backupId, backup.createdAt, backup.status]);

        const head = ['BACKUP ID', 'CREATION DATE', 'STATUS'];

        Logger.println(formatTable([head, ...formattedLines]));
      }
    }
  },
});
