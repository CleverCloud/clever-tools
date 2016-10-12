var Bacon = require("baconjs");
var _ = require("lodash");
var request = require("request");
var autocomplete = require("cliparse").autocomplete;

var Logger = require("../logger.js");
var conf = require("./configuration.js");

var Notification = module.exports;

var makeJsonRequest = function(api, verb, url, queryParams, body) {
  var completeUrl = conf.API_HOST + url
  Logger.debug(verb + ' ' + completeUrl);
  var options = {
    method: verb,
    url: completeUrl,
    headers: {
      authorization: api.session.getAuthorization(verb, completeUrl, queryParams),
      "Accept": "application/json"
    }
  };
  if(completeUrl.substring(0,8) === 'https://')
    options.agent = new (require("https").Agent)({ keepAlive: true })

  if(body) options.json = body;
  var s_res = Bacon.fromNodeCallback(request, options);

  return s_res.flatMapLatest(function(res) {
    if(res.statusCode >= 400) {
      return new Bacon.Error(res.body);
    }
    if(typeof res.body === "object") return res.body;

    var jsonBody = _.attempt(JSON.parse, res.body);
    if(!_.isError(jsonBody) && _.isArray(jsonBody)) {
      return jsonBody;
    } else {
      if(!_.isError(jsonBody) && jsonBody["type"] === "error") {
        return new Bacon.Error(jsonBody);
      } else {
        return new Bacon.Error("Received invalid JSON: " + res.body);
      }
    }
  });
}

Notification.list = function(api, type, owner_id, entity_id) {
  type = type === 'emailhooks' ? type : 'webhooks'
  Logger.debug("Fetching notifications for " + owner_id);
  var s_res = makeJsonRequest(api, 'GET', '/notifications/' + type + '/' + owner_id, {});
  return s_res.map(function(hooks) {
    return hooks.filter(function(hook) {
      var emptyScope = !hook.scope || hook.scope.length == 0;
      return !entity_id || emptyScope || hook.scope.indexOf(entity_id) >= 0;
    });
  });
};

Notification.add = function(api, type, owner_id, name, targets, scope, events) {
  type = type === 'emailhooks' ? type : 'webhooks';
  Logger.debug("Registering notification for " + owner_id);

  var body = {};
  if(type === 'emailhooks') {
    body = { name: name, notified: targets };
  } else if(type === 'webhooks') {
    body = { name: name, urls: targets };
  }

  if(scope) body.scope = scope;
  if(events) body.events = events;

  var s_res = makeJsonRequest(api, 'POST', '/notifications/' + type + '/' + owner_id, {}, body);
  return s_res;
};

Notification.addEmailhook = function(api, owner_id, name, targets, scope, events) {
  Logger.debug("Registering notification for " + owner_id);

  var body = { name: name, notify: targets };

  if(scope) body.scope = scope;
  if(events) body.events = events;

  var s_res = makeJsonRequest(api, 'POST', '/notifications/emailhooks/' + owner_id, {}, body);
  return s_res;
};

Notification.remove = function(api, type, owner_id, notif_id) {
  type = type === 'emailhooks' ? type : 'webhooks'
  Logger.debug("Removing notification " + notif_id + " for " + owner_id);

  var s_res = makeJsonRequest(api, 'DELETE', '/notifications/' + type + '/' + owner_id + '/' + notif_id, {});
  return s_res.flatMapError(function(error) {
    if(error === 'Received invalid JSON: ') {
      return null;
    } else {
      return new Bacon.Error(error);
    }
  });
};

Notification.listMetaEvents = function() {
  return autocomplete.words([
   "META_SERVICE_LIFECYCLE",
   "META_DEPLOYMENT_RESULT",
   "META_SERVICE_MANAGEMENT",
   "META_CREDITS"
  ]);
};
