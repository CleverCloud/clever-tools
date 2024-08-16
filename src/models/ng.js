import * as autocomplete from 'cliparse';
import * as Organisation from '../models/organisation.js';
import * as User from '../models/user.js';
import * as AppConfig from '../models/app_configuration.js';
import * as ngApi from '@clevercloud/client/cjs/api/v4/network-group.js';
import { sendToApi } from './send-to-api.js';

export async function getOwnerId (orgaIdOrName, alias) {
  if (orgaIdOrName == null) {
    try {
      return (await AppConfig.getAppDetails({ alias })).ownerId;
    }
    catch (error) {
      return (await User.getCurrentId());
    }
  }
  else {
    return (await Organisation.getId(orgaIdOrName));
  }
}

export async function getId (ownerId, ngIdOrLabel) {
  if (ngIdOrLabel == null) {
    return null;
  }

  if (ngIdOrLabel.ngId != null) {
    return ngIdOrLabel.ngId;
  }

  return getByLabel(ownerId, ngIdOrLabel.ngLabel)
    .then((ng) => ng.id);

}

async function getByLabel (ownerId, label) {
  const networkGroups = await ngApi.listNetworkGroups({ ownerId }).then(sendToApi);
  const filteredNgs = networkGroups.filter((ng) => ng.label === label);

  if (filteredNgs.length === 0) {
    throw new Error('Network Group not found');
  }
  if (filteredNgs.length > 1) {
    throw new Error('Ambiguous Network Group label');
  }

  return filteredNgs[0];
}

export function listAvailablePeerRoles () {
  return autocomplete.words(['client', 'server']);
}

export function listAvailableMemberTypes () {
  return autocomplete.words(['application', 'addon', 'external']);
}
