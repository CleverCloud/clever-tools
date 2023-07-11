'use strict';

const { sendToApi } = require('../models/send-to-api.js');
const { getBackups } = require('@clevercloud/client/cjs/api/v2/backups.js');
const { println } = require('../logger.js');
const formatTable = require('../format-table')();
const superagent = require('superagent');
const fs = require('fs');
const { findOwnerId } = require('../models/addon.js');
const { resolveRealId } = require('../models/ids-resolver.js');

async function listBackups (params) {

  const { org } = params.options;
  const [addonIdOrRealId] = params.args;

  const addonId = await resolveRealId(addonIdOrRealId);
  const ownerId = await findOwnerId(org, addonId);

  const backups = await getBackups({ ownerId, ref: addonId }).then(sendToApi);

  if (backups.length === 0) {
    println('There are no backups yet');
    return;
  }

  const formattedLines = backups
    .sort((a, b) => a.creation_date.localeCompare(b.creation_date))
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

async function downloadBackups (params) {

  const { org, output } = params.options;
  const [addonIdOrRealId, backupId] = params.args;

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

  if (output) {
    fs.writeFileSync(output, res.body);
    return;
  }

  process.stdout.write(res.body);
}

module.exports = { listBackups, downloadBackups };
