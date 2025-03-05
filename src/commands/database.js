import { sendToApi } from '../models/send-to-api.js';
import { getBackups } from '@clevercloud/client/esm/api/v2/backups.js';
import { Logger } from '../logger.js';
import { formatTable as initFormatTable } from '../format-table.js';
import fs from 'node:fs';
import { Writable } from 'node:stream';
import { findOwnerId } from '../models/addon.js';
import { resolveRealId, resolveAddonId } from '../models/ids-resolver.js';

const formatTable = initFormatTable();

export async function listBackups (params) {

  const { org, format } = params.options;
  const [addonIdOrRealId] = params.args;

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
      const formattedLines = sortedBackups
        .map((backup) => [
          backup.backup_id,
          backup.creation_date,
          backup.status,
        ]);

      const head = [
        'BACKUP ID',
        'CREATION DATE',
        'STATUS',
      ];

      Logger.println(formatTable([
        head,
        ...formattedLines,
      ]));
    }
  }
}

export async function downloadBackups (params) {

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

  await response
    .body
    .pipeTo(
      Writable.toWeb(output ? fs.createWriteStream(output) : process.stdout),
    );
}
