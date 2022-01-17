'use strict';

const autocomplete = require('cliparse').autocomplete;

const AppConfig = require('./app_configuration.js');

const ngApi = require('@clevercloud/client/cjs/api/v4/networkgroup.js');
const { sendToApi } = require('./send-to-api.js');

async function getOwnerId () {
  return (await AppConfig.getAppDetails({})).ownerId;
}

async function getId (ownerId, ngIdOrLabel) {
  if (ngIdOrLabel == null) {
    return null;
  }

  if (ngIdOrLabel.ng_id != null) {
    return ngIdOrLabel.ng_id;
  }

  return getByLabel(ownerId, ngIdOrLabel.ng_label)
    .then((ng) => ng.id);
}

async function getByLabel (ownerId, label) {
  const networkGroups = await ngApi.get({ ownerId }).then(sendToApi);
  const filteredNgs = networkGroups.filter((ng) => ng.label === label);

  if (filteredNgs.length === 0) {
    throw new Error('Network Group not found');
  }
  if (filteredNgs.length > 1) {
    throw new Error('Ambiguous Network Group label');
  }

  return filteredNgs[0];
}

function listAvailablePeerRoles () {
  return autocomplete.words(['client', 'server']);
}

function listAvailableMemberTypes () {
  return autocomplete.words(['application', 'addon', 'external']);
}

module.exports = {
  getOwnerId,
  getId,
  listAvailablePeerRoles,
  listAvailableMemberTypes,
};
