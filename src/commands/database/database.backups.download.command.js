import { databaseIdArg } from './database.args.js';
import { colorOpt, updateNotifierOpt, verboseOpt, orgaIdOrNameOpt, humanJsonOutputFormatOpt } from '../global.opts.js';
import { getBackups } from '@clevercloud/client/esm/api/v2/backups.js';
import fs from 'node:fs';
import { Writable } from 'node:stream';
import { formatTable } from '../../format-table.js';
import { Logger } from '../../logger.js';
import { findOwnerId } from '../../models/addon.js';
import { resolveAddonId, resolveRealId } from '../../models/ids-resolver.js';
import { sendToApi } from '../../models/send-to-api.js';

export const databaseBackupsDownloadCommand = {
  name: 'download',
  description: 'Download a database backup',
  experimental: false,
  featureFlag: null,
  opts: {
    output: {
      name: 'output',
      description: 'Redirect the output of the command in a file',
      type: 'option',
      metavar: null,
      aliases: ['out'],
      default: null,
      required: null,
      parser: null,
      complete: null
    },
    color: colorOpt,
    'update-notifier': updateNotifierOpt,
    verbose: verboseOpt,
    org: orgaIdOrNameOpt,
    format: humanJsonOutputFormatOpt
  },
  args: [
    {
      name: 'backup-id',
      description: 'A Database backup ID (format: UUID)',
      parser: null,
      complete: null
    },
    databaseIdArg,
  ],
  async execute(params) {
    const { org, output } = params.options;
      const [addonIdOrRealId, backupId] = params.args;
    
      const addonId = await resolveRealId(addonIdOrRealId);
      const ownerId = await findOwnerId(org, addonId);
    
      const backups = await getBackups({ ownerId, ref: addonId }).then(sendToApi);
      const backup = backups.find((backup) => backup.backup_id === backupId);
    
      if (backup == null) {
        throw new Error('no backup with this ID');
      }
    
      const response = await globalThis.fetch(backup.download_url);
      if (!response.ok) {
        throw new Error('Failed to download backup');
      }
    
      await response.body.pipeTo(Writable.toWeb(output ? fs.createWriteStream(output) : process.stdout));
  }
};
