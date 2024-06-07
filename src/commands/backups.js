
'use strict';

const fs = require('fs');

const formatTable = require('../format-table')();
const Logger = require('../logger.js');
const superagent = require('superagent');
const { findOwnerId } = require('../models/addon.js');
const { sendToApi } = require('../models/send-to-api.js');
const { resolveRealId, resolveAddonId } = require('../models/ids-resolver.js');

const { getBackups } = require('@clevercloud/client/cjs/api/v2/backups.js');
const { println } = require('../logger.js');

async function downloadBackups (params) {
  const { org, download: backupId, output } = params.options;
  const [addonIdOrRealId] = params.args;

  const addonId = await resolveRealId(addonIdOrRealId);
  const ownerId = await findOwnerId(org, addonId);

  const backups = await getBackups({ ownerId, ref: addonId }).then(sendToApi);
  const backup = backups.find((backup) => backup.backup_id === backupId);

  if (backup == null) {
    throw new Error('no backup with this ID');
  }

  const res = await superagent
    .get(backup.download_url)
    .responseType('blob');

  const url = new URL(backup.download_url);
  let filename = output || url.pathname.split('/').pop();

  if (filename !== '-') {
    while (fs.existsSync(filename)) {
      filename = `${Math.random().toString(36).substring(2)}-${filename}`;
    }
    fs.writeFileSync(filename, res.body);
    Logger.println(`Backup downloaded to ${filename}`);
  }
  else {
    process.stdout.write(res.body);
  }
}

async function listBackups (params) {
  const { org, download, format } = params.options;
  const [addonIdOrRealId] = params.args;

  const noBackupsDb = ['kv'];
  if (noBackupsDb.some((db) => addonIdOrRealId.startsWith(db + '_'))) {
    throw new Error('This add-on is distributed and resilient by design, backups are not available for it');
  }

  if (download) {
    await downloadBackups(params);
    return;
  }
  else if (download === '') {
    throw new Error('You must specify a database ID to list its backups');
  }

  const realId = await resolveRealId(addonIdOrRealId);
  const addonId = await resolveAddonId(addonIdOrRealId);
  const ownerId = await findOwnerId(org, realId);

  const backups = await getBackups({ ownerId, ref: realId }).then(sendToApi);

  if (backups.length === 0 && format === 'human') {
    println('There are no backups yet');
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

      println(formatTable([
        head,
        ...formattedLines,
      ]));
    }
  }
}

module.exports = {
  list: listBackups,
  download: downloadBackups,
};
