'use strict';

const colors = require('colors/safe');

const AppConfig = require('../models/app_configuration.js');
const handleCommandStream = require('../command-stream-handler');
const Logger = require('../logger.js');
const Notification = require('../models/notification.js');
const Organisation = require('../models/organisation.js');
const User = require('../models/user.js');

function getOrgaIdOrUserId (api, orgIdOrName) {
  if (orgIdOrName == null) {
    return User.getCurrentId(api);
  }
  return Organisation.getId(api, orgIdOrName);
}

function getOwnerAndApp (api, params, useLinkedApp) {
  const { alias } = params.options;

  if (!useLinkedApp) {
    return getOrgaIdOrUserId(api, params.options.org)
      .flatMapLatest((ownerId) => ({ ownerId }));
  }

  return AppConfig.getAppData(alias)
    .flatMapLatest((appData) => {
      if (appData.org_id) {
        return { ownerId: appData.org_id, appId: appData.app_id };
      }
      return User.getCurrentId(api).flatMapLatest((id) => {
        return { ownerId: id, appId: appData.app_id };
      });
    });
}

function displayWebhook (hook) {
  Logger.println((hook.name && colors.bold(hook.name)) || hook.id);
  Logger.println(`  id: ${hook.id}`);
  Logger.println(`  services: ${(hook.scope && hook.scope.join(', ')) || hook.ownerId}`);
  Logger.println(`  events: ${(hook.events && hook.events.join(', ')) || colors.bold('ALL')}`);
  Logger.println('  hooks:');
  hook.urls.forEach((url) => Logger.println(`    ${url.url} (${url.format})`));
  Logger.println();
}

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

function listWebhooks (api, params) {
  return listNotifications(api, params, 'webhooks');
}

function listEmailNotifications (api, params) {
  return listNotifications(api, params, 'emailhooks');
}

function listNotifications (api, params, type) {
  const { 'list-all': listAll } = params.options;

  const s_hooks = getOwnerAndApp(api, params, !listAll)
    .flatMapLatest((ownerAndApp) => {
      return Notification.list(api, type, ownerAndApp.ownerId, ownerAndApp.appId);
    })
    .map((hooks) => {
      hooks.forEach((hook) => {
        if (type === 'emailhooks') {
          displayEmailhook(hook);
        }
        else {
          displayWebhook(hook);
        }
      });
    });

  handleCommandStream(s_hooks);
}

function addWebhook (api, params) {
  const { format, event, service } = params.options;
  const eventTypes = event ? event.split(',') : null;
  let services = service ? service.split(',') : null;
  const [name, hookUrl] = params.args;

  const s_results = getOwnerAndApp(api, params, !params.options.org && !services)
    .flatMapLatest((ownerAndApp) => {
      if (ownerAndApp.appId) {
        services = services || [ownerAndApp.appId];
      }
      const url = { format, url: hookUrl };
      return Notification.add(api, 'webhooks', ownerAndApp.ownerId, name, [url], services, eventTypes);
    })
    .map(() => Logger.println('The webhook has been added'));

  handleCommandStream(s_results);
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
        return { 'type': 'email', 'target': el };
      }
      if (el.startsWith('user_')) {
        return { 'type': 'userid', 'target': el };
      }
      if (el === 'organisation') {
        return { 'type': 'organisation' };
      }
    })
    .filter((e) => e != null);
}

function addEmailNotification (api, params) {
  const { event, service, org } = params.options;
  const eventTypes = event ? event.split(',') : null;
  let services = service ? service.split(',') : null;
  const [name] = params.args;

  const notified = getEmailNotificationTargets(params);

  const s_results = getOwnerAndApp(api, params, !org && !services)
    .flatMapLatest((ownerAndApp) => {
      if (ownerAndApp.appId) {
        services = services || [ownerAndApp.appId];
      }
      return Notification.add(api, 'emailhooks', ownerAndApp.ownerId, name, notified, services, eventTypes);
    })
    .map(() => Logger.println('The webhook has been added'));

  handleCommandStream(s_results);
}

function removeWebhook (api, params) {
  return removeNotification(api, params, 'webhooks');
}

function removeEmailNotification (api, params) {
  return removeNotification(api, params, 'emailhooks');
}

function removeNotification (api, params, type) {
  const [notificationId] = params.args;

  const s_results = getOrgaIdOrUserId(api, params.options.org)
    .flatMapLatest((ownerId) => {
      return Notification.remove(api, type, ownerId, notificationId);
    })
    .map(() => Logger.println('The notification has been successfully removed'));

  handleCommandStream(s_results);
}

module.exports = {
  listWebhooks,
  listEmailNotifications,
  addWebhook,
  getEmailNotificationTargets,
  addEmailNotification,
  removeWebhook,
  removeEmailNotification,
};
