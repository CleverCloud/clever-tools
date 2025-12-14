import { getBackups } from '@clevercloud/client/esm/api/v2/backups.js';
import fs from 'node:fs';
import { Writable } from 'node:stream';
import { z } from 'zod';
import { defineArgument } from '../../lib/define-argument.js';
import { defineCommand } from '../../lib/define-command.js';
import { defineOption } from '../../lib/define-option.js';
import { findOwnerId } from '../../models/addon.js';
import { resolveRealId } from '../../models/ids-resolver.js';
import { sendToApi } from '../../models/send-to-api.js';
import { orgaIdOrNameOption } from '../global.options.js';
import { databaseIdArg } from './database.args.js';

export const databaseBackupsDownloadCommand = defineCommand({
  description: 'Download a database backup',
  since: '2.10.0',
  options: {
    output: defineOption({
      name: 'output',
      schema: z.string().optional(),
      description: 'Redirect the output of the command in a file',
      aliases: ['out'],
      placeholder: 'file-path',
    }),
    org: orgaIdOrNameOption,
  },
  args: [
    databaseIdArg,
    defineArgument({
      schema: z.string(),
      description: 'A Database backup ID (format: UUID)',
      placeholder: 'backup-id',
    }),
  ],
  async handler(options, addonIdOrRealId, backupId) {
    const { org, output } = options;

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
  },
});
