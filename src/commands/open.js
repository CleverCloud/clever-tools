var _ = require("lodash");

var AppConfiguration = require("../models/app_configuration.js");
var Domain = require("../models/domain.js");
var OpenBrowser = require("../open-browser.js");

var Logger = require("../logger.js");

var open = module.exports = function(api, params) {
  var alias = params.options.alias;
  var s_appData = AppConfiguration.getAppData(alias);
  var s_vhost = s_appData.flatMapLatest(function(appData) {
    return Domain.getBest(api, appData.app_id, appData.orga_id);
  });

  var s_open = s_vhost.flatMapLatest(function(vhost) {
    Logger.println("Opening the application in your browser");
    return OpenBrowser.openPage("http://" + vhost.fqdn);
  });

  s_open.onValue();
  s_open.onError(Logger.error);
};
