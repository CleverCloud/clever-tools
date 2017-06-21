var Bacon = require("baconjs");
var _ = require("lodash");
var request = require("request");
var autocomplete = require("cliparse").autocomplete;

var Logger = require("../logger.js");
var conf = require("./configuration.js");

var Drain = module.exports;

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

Drain.list = function(api, appId) {
  Logger.debug("Fetching drains for " + appId);
  var s_res = makeJsonRequest(api, 'GET', '/logs-drains/' + appId, {});
  return s_res.map(function(drains) {
    return drains
  });
};

Drain.add = function(api, appId, drainTargetURL, drainTargetType, drainTargetCredentials) {
  Logger.debug("Registering drain for " + appId);
  var body = {}
  if (drainTargetCredentials) {
    body = {
      "url": drainTargetURL,
      "drainType": drainTargetType,
      "credentials": {
        "username": drainTargetCredentials.username,
        "password": drainTargetCredentials.password
      }
    }    
  } else {
    body = {
      "url": drainTargetURL,
      "drainType": drainTargetType,
    }
  }
  var s_res = makeJsonRequest(api, 'POST', '/logs-drains/' + appId, {}, body);
  return s_res;
};

Drain.remove = function(api, appId, drainId) {
  Logger.debug("Removing drain " + drainId + " for " + appId);
  var s_res = makeJsonRequest(api, 'DELETE', '/logs-drains/' + appId + '/' + drainId, {});
  return s_res;
};

Drain.listMetaEvents = function() {
  return autocomplete.words([
   "META_SERVICE_LIFECYCLE",
   "META_DEPLOYMENT_RESULT",
   "META_SERVICE_MANAGEMENT",
   "META_CREDITS"
  ]);
};
