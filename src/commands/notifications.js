var _ = require("lodash");
var path = require("path");
var Bacon = require("baconjs");
var nodegit = require("nodegit");
var colors = require("colors");

var Logger = require("../logger.js");

var AppConfig = require("../models/app_configuration.js");
var Notification = require("../models/notification.js");
var Organisation = require("../models/organisation.js");
var User = require("../models/user.js");

var notifs = module.exports;

var getOrgaIdOrUserId = function(api, orgIdOrName) {
  if(!orgIdOrName) {
    return User.getCurrentId(api);
  } else {
    return Organisation.getId(api, orgIdOrName);
  }
}

var getOwnerAndApp = function(api, params, useLinkedApp) {
  var alias = params.options.alias;


  if(!useLinkedApp) {
    return getOrgaIdOrUserId(api, params.options.org).map(function(ownerId) {
      return {ownerId: ownerId};
    });
  } else {
    return AppConfig.getAppData(alias).flatMapLatest(function(appData) {
      if(appData.org_id) {
        return {ownerId: appData.org_id, appId: appData.app_id}
      } else {
        return User.getCurrentId(api).map(function(id) {
          return {ownerId: id, appId: appData.app_id};
        });
      }
    });
  }

}

var displayWebhook = function(hook) {
  Logger.println(hook.name && hook.name.bold || hook.id);
  Logger.println("  id: " + hook.id);
  Logger.println("  services: " + (hook.scope && hook.scope.join(", ") || hook.ownerId));
  Logger.println("  events: " + (hook.events && hook.events.join(", ") || "ALL".bold));
  Logger.println("  hooks:")
  hook.urls.forEach(function(url) {
    Logger.println("    " + url.url + " (" + url.format + ")");
  });
  Logger.println();
}

var displayEmailhook = function(hook) {
  Logger.println(hook.name && hook.name.bold || hook.id);
  Logger.println("  id: " + hook.id);
  Logger.println("  services: " + (hook.scope && hook.scope.join(", ") || hook.ownerId));
  Logger.println("  events: " + (hook.events && hook.events.join(", ") || "ALL".bold));
  if(hook.notified) {
    Logger.println("  to:")
    hook.notified.forEach(function(target) {
      Logger.println("    " + (target.target || "whole team"));
    });
  } else {
    Logger.println("  to: whole team");
  }
  Logger.println();
}

var listWebhooks = notifs.listWebhooks = function(api, params) {
  return listNotifications(api, params, "webhooks");
}

var listEmailNotifications = notifs.listEmailNotifications = function(api, params) {
  return listNotifications(api, params, "emailhooks");
}

var listNotifications = function(api, params, type) {
  var listAll = params.options["list-all"];
  var s_ownerAndApp = getOwnerAndApp(api, params, !listAll);
  var s_hooks = s_ownerAndApp.flatMapLatest(function(ownerAndApp) {
    return Notification.list(api, type, ownerAndApp.ownerId, ownerAndApp.appId);
  });
  var display = type === 'emailhooks' ? displayEmailhook : displayWebhook;

  s_hooks.onValue(function(hooks) {
    hooks.forEach(function(hook) {
      display(hook);
    });
  });
  s_hooks.onError(Logger.error);
};

var addWebhook = notifs.addWebhook = function(api, params) {
  var format = params.options.format;
  var event = params.options.event;
  var event_types = event ? event.split(',') : null;
  var service = params.options.service;
  var services = service ? service.split(',') : null;

  var name = params.args[0];
  var hookUrl = params.args[1];

  var s_ownerAndApp = getOwnerAndApp(api, params, !params.options.org && !services);
  var s_results = s_ownerAndApp.flatMapLatest(function(ownerAndApp) {
    if(ownerAndApp.appId) {
      services = services || [ownerAndApp.appId];
    }
    var url = {
      format: format,
      url: hookUrl
    };
    return Notification.add(api, "webhooks", ownerAndApp.ownerId, name, [url], services, event_types);
  });

  s_results.onValue(function() {
    Logger.println("The webhook has been added")
  });
  s_results.onError(Logger.error);
};

var getEmailNotificationTargets = notifs.getEmailNotificationTargets = function(params) {
  var elems = params.options.notify ? params.options.notify.split(',') : null;
  if(elems === null) return [];

  return elems.map(function(e) {
    if(e.indexOf("@") >= 0) return { "type": "email", "target": e };
    if(e.substr(0,5) === "user_") return { "type": "userid", "target": e };
    if(e === "organisation") return { "type": "organisation" };
  }).filter(function(e) { return !!e });
}

var addEmailNotification = notifs.addEmailNotification = function(api, params) {
  var format = params.options.format;
  var event = params.options.event;
  var event_types = event ? event.split(',') : null;
  var service = params.options.service;
  var services = service ? service.split(',') : null;

  var name = params.args[0];

  var notified = getEmailNotificationTargets(params);

  var s_ownerAndApp = getOwnerAndApp(api, params, !params.options.org && !services);
  var s_results = s_ownerAndApp.flatMapLatest(function(ownerAndApp) {
    if(ownerAndApp.appId) {
      services = services || [ownerAndApp.appId];
    }

    return Notification.add(api, "emailhooks", ownerAndApp.ownerId, name, notified, services, event_types);
  });

  s_results.onValue(function() {
    Logger.println("The webhook has been added")
  });
  s_results.onError(Logger.error);
};

var removeWebhook = notifs.removeWebhook = function(api, params) {
  return removeNotification(api, params, "webhooks");
};

var removeEmailNotification = notifs.removeEmailNotification = function(api, params) {
  return removeNotification(api, params, "emailhooks");
};

var removeNotification = function(api, params, type) {
  var notificationId = params.args[0];

  var s_ownerId = getOrgaIdOrUserId(api, params.options.org);
  var s_results = s_ownerId.flatMapLatest(function(ownerId) {
    return Notification.remove(api, type, ownerId, notificationId);
  });

  s_results.onValue(function() {
    Logger.println("The notification has been successfully removed");
  });
  s_results.onError(Logger.error);
};

