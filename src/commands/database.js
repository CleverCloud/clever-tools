'use strict';

const { sendToApi } = require('../models/send-to-api.js');
const { getBackups } = require('@clevercloud/client/cjs/api/v2/backups.js');
const { println } = require('../logger.js');
const formatTable = require('../format-table')();
const superagent = require('superagent');
const { getSummary } = require('@clevercloud/client/cjs/api/v2/user.js');
const fs = require('fs');

async function listBackups (params) {

  const [databaseId] = params.args;
  const { org } = params.options;

  const ownerId = await resolveOwnerId(org, databaseId);
  if (ownerId == null) {
    throw new Error('organisation ID is mandatory');
  }

  const backups = await getBackups({ ownerId, ref: databaseId }).then(sendToApi);

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

  const [databaseId, backupId] = params.args;
  const { org, output } = params.options;

  const ownerId = await resolveOwnerId(org, databaseId);
  if (ownerId == null) {
    throw new Error('organisation ID is mandatory');
  }

  const backups = await getBackups({ ownerId, ref: databaseId }).then(sendToApi);
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

/**
 * Try to get an ownerId from the API
 * @param {*} org cliparse param's option for orga
 * @param {String} databaseId the resource which belong to the owner we are looking for
 * @returns the owner ID (or null if cannot be found)
 */
async function resolveOwnerId (org, databaseId) {

  if (org != null && org.orga_name != null) {
    return org.orga_name;
  }

  const summary = await getSummary().then(sendToApi);

  const userHasAddon = summary.user.addons.some((addon) => addon.realId === databaseId);
  if (userHasAddon) {
    return summary.user.id;
  }

  for (const orga of summary.organisations) {
    const orgaHasAddon = orga.addons.some((addon) => addon.realId === databaseId);
    if (orgaHasAddon) {
      return orga.id;
    }
  }

  return null;
}

module.exports = { listBackups, downloadBackups };
