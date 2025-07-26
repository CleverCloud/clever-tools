import { styleText } from 'node:util';

import { Logger } from '../logger.js';
import { getOwnerAndApp, getOrgaIdOrUserId } from '../models/notification.js';

import { getEmailhooks, createEmailhook, deleteEmailhook } from '@clevercloud/client/esm/api/v2/notification.js';
import { sendToApi } from '../models/send-to-api.js';

export async function list (params) {
  const { org, 'list-all': listAll, format } = params.options;

  // TODO: fix alias option
  const { ownerId, appId } = await getOwnerAndApp(null, org, !listAll);
  const hooks = await getEmailhooks({ ownerId }).then(sendToApi);

  const formattedHooks = hooks
    .filter((hook) => {
      const emptyScope = !hook.scope || hook.scope.length === 0;
      return !appId || emptyScope || hook.scope.includes(appId);
    })
    .map((hook) => ({
      id: hook.id,
      name: hook.name,
      ownerId: hook.ownerId,
      services: hook.scope ?? [hook.ownerId],
      events: hook.events ?? ['ALL'],
      notified: hook.notified ? hook.notified.map(({ target }) => target ?? 'whole team') : ['whole team'],
    }));

  switch (format) {
    case 'json': {
      Logger.printJson(formattedHooks);
      break;
    }
    case 'human':
    default: {
      formattedHooks.forEach((hook) => {
        Logger.println(styleText('bold', hook.name ?? hook.id));
        Logger.println(`  id: ${hook.id}`);
        Logger.println(`  services: ${hook.services.join(', ')}`);
        Logger.println(`  events: ${hook.events.join(', ')}`);
        if (hook.notified.length > 1) {
          Logger.println('  to:');
          hook.notified.forEach((target) => Logger.println(`    ${target}`));
        }
        else {
          Logger.println(`  to: ${hook.notified[0]}`);
        }
      });
    }
  }
}

export function getEmailNotificationTargets (notifTargets) {

  if (notifTargets == null) {
    return [];
  }

  return notifTargets
    .map((el) => {
      if (el.includes('@')) {
        return { type: 'email', target: el };
      }
      if (el.startsWith('user_')) {
        return { type: 'userid', target: el };
      }
      if (el.toLowerCase() === 'organisation') {
        return { type: 'organisation' };
      }
      return null;
    })
    .filter((e) => e != null);
}

export async function add (params) {
  const { org, event: events, service, notify: notifTargets } = params.options;
  const [name] = params.args;

  // TODO: fix alias option
  const { ownerId, appId } = await getOwnerAndApp(null, org, !org && !service);

  const body = {
    name,
    notified: getEmailNotificationTargets(notifTargets),
    scope: (appId != null && service == null) ? [appId] : service,
    events,
  };

  await createEmailhook({ ownerId }, body).then(sendToApi);

  Logger.println('The webhook has been added');
}

export async function remove (params) {
  const { org } = params.options;
  const [notificationId] = params.args;

  const ownerId = await getOrgaIdOrUserId(org);
  await deleteEmailhook({ ownerId, id: notificationId }).then(sendToApi);

  Logger.println('The notification has been successfully removed');
}
