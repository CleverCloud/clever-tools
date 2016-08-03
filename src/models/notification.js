var Bacon = require("baconjs");
var _ = require("lodash");
var request = require("request");

var Logger = require("../logger.js");
var conf = require("./configuration.js");

var Notification = module.exports;

var makeJsonRequest = function(api, verb, url, queryParams, body) {
  //var completeUrl = conf.API_HOST + url
  var completeUrl = 'https://ccapi-preprod.cleverapps.io/v2' + url
  Logger.debug(verb + ' ' + completeUrl);
  var options = {
    method: verb,
    agent: new (require("https").Agent)({ keepAlive: true }),
    url: completeUrl,
    headers: {
      authorization: api.session.getAuthorization(verb, completeUrl, queryParams),
      "Accept": "application/json"
    }
  };

  if(body) options.json = body;
  var s_res = Bacon.fromNodeCallback(request, options);

  return s_res.flatMapLatest(function(res) {
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

Notification.list = function(api, owner_id, entity_id) {
  Logger.debug("Fetching notifications for " + owner_id);
  var s_res = makeJsonRequest(api, 'GET', '/notifications/webhooks/' + owner_id, {});
  return s_res.map(function(hooks) {
    return hooks.filter(function(hook) {
      var emptyScope = !hook.scope || hook.scope.length == 0;
      return !entity_id || emptyScope || hook.scope.indexOf(entity_id) >= 0;
    });
  });
};

Notification.add = function(api, owner_id, urls, scope, events) {
  Logger.debug("Registering notification for " + owner_id);

  var body = { urls: urls, scope: [], events: [] };

  if(scope) body.scope = scope;
  if(events) body.events = events;

  var s_res = makeJsonRequest(api, 'POST', '/notifications/webhooks/' + owner_id, {}, body);
  return s_res;
};

Notification.remove = function(api, owner_id, notif_id) {
  Logger.debug("Removing notification " + notif_id + " for " + owner_id);

  var s_res = makeJsonRequest(api, 'DELETE', '/notifications/webhooks/' + owner_id + '/' + notif_id, {});
  return s_res;
};

