var _ = require("lodash");
var Bacon = require("baconjs");

var Logger = require("../logger.js");

var AppConfig = require("../models/app_configuration.js");

var makeDefault = module.exports = function(api, params) {
  var alias = params.args[0];

  var s_result = AppConfig.setDefault(alias);

  s_result.onValue(function() {
    Logger.println("The application " + alias + " has been set as default");
  });

  s_result.onError(Logger.error);
};
