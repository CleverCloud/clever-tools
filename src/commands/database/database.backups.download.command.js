import { ListBackupCommand } from '@clevercloud/client/cc-api-commands/backup/list-backup-command.js';
import fs from 'node:fs';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { z } from 'zod';
import { defineArgument } from '../../lib/define-argument.js';
import { defineCommand } from '../../lib/define-command.js';
import { defineOption } from '../../lib/define-option.js';
import { clients } from '../../models/cc-api-client.js';
import { resolveAddon } from '../../models/ids-resolver.js';
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
    org: { ...orgaIdOrNameOption, deprecated: 'organisation is now resolved automatically' },
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
    const { output } = options;

    const { ownerId, realId } = await resolveAddon(addonIdOrRealId);

    const backups = await clients.ccApi.send(new ListBackupCommand({ ownerId, addonId: realId }));
    const backup = backups.find((backup) => backup.backupId === backupId);

    if (backup == null) {
      throw new Error('no backup with this ID');
    }

    const response = await globalThis.fetch(backup.downloadUrl);
    if (!response.ok) {
      throw new Error('Failed to download backup');
    }

    const nodeReadable = Readable.fromWeb(response.body);
    await pipeline(nodeReadable, output ? fs.createWriteStream(output) : process.stdout);
  },
});
