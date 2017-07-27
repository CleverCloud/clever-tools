var Bacon = require("baconjs");
var _ = require("lodash");
var request = require("request");
var autocomplete = require("cliparse").autocomplete;

var Logger = require("../logger.js");
var conf = require("./configuration.js");

var Drain = module.exports;

Drain.types = [
    { "id": "TCPSyslog" },
    { "id": "UDPSyslog" },
    { "id": "HTTP", "credentials": "optional" },
    { "id": "ElasticSearch", "credentials": "mandatory" }
];

var makeJsonRequest = function(api, verb, url, queryParams, body) {
    var completeUrl = conf.API_HOST + url;
    Logger.debug(verb + ' ' + completeUrl);
    var options = {
        method: verb,
        url: completeUrl,
        headers: {
            "Authorization": api.session.getAuthorization(verb, completeUrl, queryParams),
            "Accept": "application/json"
        }
    };
    if (completeUrl.substring(0, 8) === 'https://')
        options.agent = new(require("https").Agent)({ keepAlive: true });

    if (body) options.json = body;

    var s_res = Bacon.fromNodeCallback(request, options);

    return s_res.flatMapLatest(function(res) {
        if (res.statusCode >= 400) {
            return new Bacon.Error(res.body);
        }
        if (typeof res.body === "object") return res.body;

        var jsonBody = _.attempt(JSON.parse, res.body);
        if (!_.isError(jsonBody) && _.isArray(jsonBody)) {
            return jsonBody;
        } else {
            if (!_.isError(jsonBody) && jsonBody.type === "error") {
                return new Bacon.Error(jsonBody);
            }
        }
    });
}

Drain.list = function(api, appId) {
    Logger.debug("Fetching drains for " + appId);
    var s_res = makeJsonRequest(api, 'GET', '/logs/' + appId + '/drains', {});
    return s_res.map(function(drains) {
        return drains;
    });
};

Drain.create = function(api, appId, drainTargetURL, drainTargetType, drainTargetCredentials) {
    Logger.debug("Registering drain for " + appId);
    if (Drain.authorizeDrainCreation(drainTargetType, drainTargetCredentials)) {
        var body = "";
        if (Drain.credentialsExist(drainTargetCredentials)) {
            body = {
                "url": drainTargetURL,
                "drainType": drainTargetType,
                "credentials": {
                    "username": drainTargetCredentials.username || "",
                    "password": drainTargetCredentials.password || ""
                }
            };
        } else {
            body = {
                "url": drainTargetURL,
                "drainType": drainTargetType
            };
        }        

        var s_res = makeJsonRequest(api, 'POST', '/logs/' + appId + '/drains', {}, body);
        return s_res;
    } else {
        Logger.error("Credentials are: optional for HTTP, mandatory for ElasticSearch and TCPSyslog/UDPSyslog don't need them.")
    }
    return false;
};

Drain.remove = function(api, appId, drainId) {
    Logger.debug("Removing drain " + drainId + " for " + appId);
    var s_res = makeJsonRequest(api, 'DELETE', '/logs/' + appId + '/drains/' + drainId, {});
    return s_res;
};

Drain.enable = function(api, appId, drainId) {
    Logger.debug("Enable drain " + drainId + " for " + appId);
    var s_res = makeJsonRequest(api, 'PUT', '/logs/' + appId + '/drains/' + drainId + '/state', {}, { "state" : "ENABLED" });
    return s_res;
}

Drain.disable = function(api, appId, drainId) {
    Logger.debug("Disable drain " + drainId + " for " + appId);
    var s_res = makeJsonRequest(api, 'PUT', '/logs/' + appId + '/drains/' + drainId + '/state', {}, { "state" : "DISABLED" });
    return s_res;
}

Drain.authorizeDrainCreation = function(drainTargetType, drainTargetCredentials) {
    if (Drain.drainTypeExists(drainTargetType)) { // drain type exists   
        var credentialsStatus = Drain.credentialsStatus(drainTargetType); // retrieve creds for drain type (mandatory, optional, null)
        switch (credentialsStatus) {
            case 'mandatory':
                return Drain.credentialsExist(drainTargetCredentials);
                break;
            case 'optional':
                return true;
                break;
            case 'null':
                return Drain.credentialsEmpty(drainTargetCredentials);
                break;
            default:
                return false;
        }
    }
};

Drain.credentialsStatus = function(drainTargetType) {
    for (var i = 0; i < Drain.types.length; i++) {
        var type = Drain.types[i];
        if (type.id === drainTargetType) {
            return type.credentials ? type.credentials : 'null'; // returns mandatory, optional, null
        }
    }
}

Drain.drainTypeExists = function(drainTargetType) {
    for (var i = 0; i < Drain.types.length; i++) {
        if (Drain.types[i].id === drainTargetType) {
            return true;
        }
    }
};

Drain.credentialsExist = function(drainTargetCredentials) {
    return drainTargetCredentials.username != null && drainTargetCredentials.password != null;
};

Drain.credentialsEmpty = function(drainTargetCredentials) {
    return drainTargetCredentials.username == null && drainTargetCredentials.password == null;
}

Drain.listDrainTypes = function() {
    var typesIds = [];
    for (var i = 0; i < Drain.types.length; i++) {
        typesIds.push(Drain.types[i].id)
    }
    return autocomplete.words(typesIds);
};