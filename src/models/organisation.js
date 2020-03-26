'use strict';

const _ = require('lodash');
const Bacon = require('baconjs');

const { getSummary } = require('@clevercloud/client/cjs/api/user.js');
const { sendToApi } = require('../models/send-to-api.js');

function getId (api, orgaIdOrName) {
  return Bacon.fromPromise(getIdProm(orgaIdOrName));
}

async function getIdProm (orgaIdOrName) {
  if (orgaIdOrName == null) {
    return null;
  }

  if (orgaIdOrName.orga_id != null) {
    return orgaIdOrName.orga_id;
  }

  return getByNameProm(orgaIdOrName.orga_name)
    .then((orga) => orga.id);
}

function getByName (api, name) {
  return Bacon.fromPromise(getByNameProm(name));
}

async function getByNameProm (name) {

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

module.exports = {
  getId,
  getIdProm,
  getByName,
};
