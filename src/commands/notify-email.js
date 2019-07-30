'use strict';

const colors = require('colors/safe');

const handleCommandStream = require('../command-stream-handler');
const Logger = require('../logger.js');
const Notification = require('../models/notification.js');

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

function list (api, params) {
  const { 'list-all': listAll } = params.options;

  const s_hooks = Notification.getOwnerAndApp(api, params, !listAll)
    .flatMapLatest((ownerAndApp) => {
      return Notification.list(api, 'emailhooks', ownerAndApp.ownerId, ownerAndApp.appId);
    })
    .map((hooks) => {
      hooks.forEach((hook) => displayEmailhook(hook));
    });
  return handleCommandStream(s_hooks);
}

function getEmailNotificationTargets (params) {
  const { notify } = params.options;
  const elems = notify ? notify.split(',') : null;

  if (elems == null) {
    return [];
  }

  return elems
    .map((el) => {
      if (el.includes('@')) {
        return { type: 'email', target: el };
      }
      if (el.startsWith('user_')) {
        return { type: 'userid', target: el };
      }
      if (el === 'organisation') {
        return { type: 'organisation' };
      }
    })
    .filter((e) => e != null);
}

function add (api, params) {
  const { event, service, org } = params.options;
  const eventTypes = event ? event.split(',') : null;
  let services = service ? service.split(',') : null;
  const [name] = params.args;

  const notified = getEmailNotificationTargets(params);

  const s_results = Notification.getOwnerAndApp(api, params, !org && !services)
    .flatMapLatest((ownerAndApp) => {
      if (ownerAndApp.appId) {
        services = services || [ownerAndApp.appId];
      }
      return Notification.add(api, 'emailhooks', ownerAndApp.ownerId, name, notified, services, eventTypes);
    })
    .map(() => Logger.println('The webhook has been added'));

  handleCommandStream(s_results);
}

function remove (api, params) {
  const [notificationId] = params.args;

  const s_results = Notification.getOrgaIdOrUserId(api, params.options.org)
    .flatMapLatest((ownerId) => {
      return Notification.remove(api, 'emailhooks', ownerId, notificationId);
    })
    .map(() => Logger.println('The notification has been successfully removed'));
  return handleCommandStream(s_results);
}

module.exports = {
  list,
  add,
  remove,
  // For tests,
  getEmailNotificationTargets,
};
