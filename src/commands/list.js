var colors = require("colors");
var _ = require("lodash");

var AppConfiguration = require("../models/app_configuration.js");

var Logger = require("../logger.js");

var list = module.exports = function(api, params) {
  AppConfiguration.loadApplicationConf().onValue(function(conf) {
      if(!params.options["only-aliases"]) {
        Logger.println(conf.apps.map(function(app) {
          return "Application " + app.name + "\n" +
                 "  alias: " + app.alias.bold + "\n" +
                 "  id: " + app.app_id + "\n" +
                 "  deployment url: " + app.deploy_url
        }).join('\n\n'));
      } else {
        Logger.println(_.pluck(conf.apps, "alias").join('\n'));
      }
  });
};
