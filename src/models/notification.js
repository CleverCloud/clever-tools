import cliparse from 'cliparse';
import * as AppConfig from './app_configuration.js';
import * as Organisation from './organisation.js';
import * as User from './user.js';

export function listMetaEvents() {
  return cliparse.autocomplete.words([
    'META_SERVICE_LIFECYCLE',
    'META_DEPLOYMENT_RESULT',
    'META_SERVICE_MANAGEMENT',
    'META_CREDITS',
  ]);
}

export function getOrgaIdOrUserId(orgIdOrName) {
  return orgIdOrName == null ? User.getCurrentId() : Organisation.getId(orgIdOrName);
}

export async function getOwnerAndApp(alias, org, useLinkedApp) {
  if (!useLinkedApp) {
    const ownerId = await getOrgaIdOrUserId(org);
    return { ownerId };
  }

  return AppConfig.getAppDetails({ alias });
}
