'use strict';

const colors = require('colors/safe');

const Logger = require('../logger.js');
const { getOwnerAndApp, getOrgaIdOrUserId } = require('../models/notification.js');

const { getEmailhooks, createEmailhook, deleteEmailhook } = require('@clevercloud/client/cjs/api/v2/notification.js');
const { sendToApi } = require('../models/send-to-api.js');

function displayEmailhook (hook) {
  Logger.println((hook.name && colors.bold(hook.name)) || hook.id);
  Logger.println(`  id: ${hook.id}`);
  Logger.println(`  services: ${(hook.scope && hook.scope.join(', ')) || hook.ownerId}`);
  Logger.println(`  events: ${(hook.events && hook.events.join(', ')) || colors.bold('ALL')}`);
  if (hook.notified) {
    Logger.println('  to:');
    hook.notified.forEach((target) => Logger.println(`    ${target.target || 'whole team'}`));
  }
  else {
    Logger.println('  to: whole team');
  }
  Logger.println();
}

async function list (params) {
  const { org, 'list-all': listAll } = params.options;

  // TODO: fix alias option
  const { ownerId, appId } = await getOwnerAndApp(null, org, !listAll);
  const hooks = await getEmailhooks({ ownerId }).then(sendToApi);

  hooks
    .filter((hook) => {
      const emptyScope = !hook.scope || hook.scope.length === 0;
      return !appId || emptyScope || hook.scope.includes(appId);
    })
    .forEach((hook) => displayEmailhook(hook));
}

function getEmailNotificationTargets (notifTargets) {

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

async function add (params) {
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

async function remove (params) {
  const { org } = params.options;
  const [notificationId] = params.args;

  const ownerId = await getOrgaIdOrUserId(org);
  await deleteEmailhook({ ownerId, id: notificationId }).then(sendToApi);

  Logger.println('The notification has been successfully removed');
}

module.exports = {
  list,
  add,
  remove,
  // For tests,
  getEmailNotificationTargets,
};
