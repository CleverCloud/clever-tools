'use strict';

const _ = require('lodash');

const { getSummary } = require('@clevercloud/client/cjs/api/v2/user.js');
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

module.exports = {
  getId,
};
