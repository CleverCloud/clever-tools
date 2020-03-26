'use strict';

const _ = require('lodash');
const autocomplete = require('cliparse').autocomplete;

const AppConfig = require('./app_configuration.js');

const organisation = require('@clevercloud/client/cjs/api/organisation.js');
const { getSummary } = require('@clevercloud/client/cjs/api/user.js');
const { sendToApi } = require('../models/send-to-api.js');

async function getId (orgaIdOrName) {
  if (orgaIdOrName == null) {
    return null;
  }

  if (orgaIdOrName.orga_id != null) {
    return orgaIdOrName.orga_id;
  }

  return getByName(orgaIdOrName.orga_name)
    .then((orga) => orga.id);
}

async function getByName (name) {

  const fullSummary = await getSummary({}).then(sendToApi);
  const filteredOrgs = _.filter(fullSummary.organisations, { name });

  if (filteredOrgs.length === 0) {
    throw new Error('Organisation not found');
  }
  if (filteredOrgs.length > 1) {
    throw new Error('Ambiguous organisation name');
  }

  return filteredOrgs[0];
}

async function getNamespaces (params) {
  const { alias } = params.options;
  const { ownerId } = await AppConfig.getAppDetails({ alias });

  return organisation.getNamespaces({ id: ownerId }).then(sendToApi);
}

function completeNamespaces () {
  // Sadly we do not have access to current params in complete as of now
  const params = { options: {} };

  return getNamespaces(params).then(autocomplete.words);
};

module.exports = {
  getId,
  getNamespaces,
  completeNamespaces,
};
