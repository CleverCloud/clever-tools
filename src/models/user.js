var _ = require("lodash");
var Bacon = require("baconjs");

var Logger = require("../logger.js");

var AppConfiguration = require("./app_configuration.js");

var User = module.exports;

User.getCurrentId = function(api) {
  return api.self.get().send().map(function(self) {
    return self.id;
  });

};

