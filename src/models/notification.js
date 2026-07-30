import {
  NOTIFICATION_EVENT_TYPES,
  NOTIFICATION_META_EVENT_TYPES,
} from '@clevercloud/client/cc-api-commands/notification/notification-event-types.js';
import * as AppConfig from './app_configuration.js';
import * as Organisation from './organisation.js';
import * as User from './user.js';

/**
 * Meta events first: they cover a whole family of events and keep working when new events are added.
 *
 * @returns {Array<string>} every event type a notification can be restricted to
 */
export function listEventTypes() {
  return [...NOTIFICATION_META_EVENT_TYPES, ...NOTIFICATION_EVENT_TYPES];
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
