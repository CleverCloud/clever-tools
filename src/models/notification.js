import * as AppConfig from './app_configuration.js';
import * as Organisation from './organisation.js';
import * as User from './user.js';

export function listMetaEvents() {
  return ['META_SERVICE_LIFECYCLE', 'META_DEPLOYMENT_RESULT', 'META_SERVICE_MANAGEMENT', 'META_CREDITS'];
}

export function getOrgaIdOrUserId(orgIdOrName) {
  return orgIdOrName == null ? User.getCurrentId() : Organisation.getId(orgIdOrName);
}

export async function getOwnerAndApp(org, useLinkedApp) {
  if (org != null) {
    return { ownerId: await Organisation.getId(org) };
  }
  if (useLinkedApp) {
    return AppConfig.getAppDetails({});
  }
  return { ownerId: await User.getCurrentId() };
}
