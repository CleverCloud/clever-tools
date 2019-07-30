'use strict';

const autocomplete = require('cliparse').autocomplete;

const AppConfig = require('../models/app_configuration.js');
const Organisation = require('../models/organisation.js');
const User = require('../models/user.js');

function listMetaEvents () {
  return autocomplete.words([
    'META_SERVICE_LIFECYCLE',
    'META_DEPLOYMENT_RESULT',
    'META_SERVICE_MANAGEMENT',
    'META_CREDITS',
  ]);
}

function getOrgaIdOrUserId (orgIdOrName) {
  return (orgIdOrName == null)
    ? User.getCurrentId()
    : Organisation.getIdProm(orgIdOrName);
}

async function getOwnerAndApp (alias, org, useLinkedApp) {

  if (!useLinkedApp) {
    const ownerId = await getOrgaIdOrUserId(org);
    return { ownerId };
  }

  const appData = await AppConfig.getAppData(alias).toPromise();
  if (appData.org_id) {
    return { ownerId: appData.org_id, appId: appData.app_id };
  }
  const id = await User.getCurrentId();
  return { ownerId: id, appId: appData.app_id };
}

module.exports = {
  listMetaEvents,
  getOrgaIdOrUserId,
  getOwnerAndApp,
};
