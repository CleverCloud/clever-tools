'use strict';

const _ = require('lodash');
const autocomplete = require('cliparse').autocomplete;

const networkgroup = require('@clevercloud/client/cjs/api/v4/networkgroup.js');
const { sendToApi } = require('../models/send-to-api.js');

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
  const networkgroups = await networkgroup.get({ ownerId }).then(sendToApi);
  const filteredNgs = _.filter(networkgroups, { label });

  if (filteredNgs.length === 0) {
    throw new Error('Networkgroup not found');
  }
  if (filteredNgs.length > 1) {
    throw new Error('Ambiguous networkgroup label');
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
  getId,
  listAvailablePeerRoles,
  listAvailableMemberTypes,
};
