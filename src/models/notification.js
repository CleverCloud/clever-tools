'use strict';

const cliparse = require('cliparse');
const AppConfig = require('../models/app_configuration.js');
const Organisation = require('../models/organisation.js');
const User = require('../models/user.js');

function listMetaEvents () {
  return cliparse.autocomplete.words([
    'META_SERVICE_LIFECYCLE',
    'META_DEPLOYMENT_RESULT',
    'META_SERVICE_MANAGEMENT',
    'META_CREDITS',
  ]);
}

function getOrgaIdOrUserId (orgIdOrName) {
  return (orgIdOrName == null)
    ? User.getCurrentId()
    : Organisation.getId(orgIdOrName);
}

async function getOwnerAndApp (alias, org, useLinkedApp) {

  if (!useLinkedApp) {
    const ownerId = await getOrgaIdOrUserId(org);
    return { ownerId };
  }

  return AppConfig.getAppDetails({ alias });
}

module.exports = {
  listMetaEvents,
  getOrgaIdOrUserId,
  getOwnerAndApp,
};
