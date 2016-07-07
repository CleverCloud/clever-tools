var cliparse = require("cliparse");

var Application = require("./models/application.js");

var Parsers = module.exports;

//PARSERS
Parsers.flavor = function(flavor) {
  var flavors = Application.listAvailableFlavors();

  if(flavors.indexOf(flavor) == -1) {
    return cliparse.parsers.error("Invalid value: " + flavor);
  } else {
    return cliparse.parsers.success(flavor);
  }
};

Parsers.instances = function(instances) {
  var parsedInstances = parseInt(instances, 10);
  if (isNaN(parsedInstances)) {
    return cliparse.parsers.error("Invalid number: " + instances);
  } else {
    if (parsedInstances < 1 || parsedInstances > 20) {
      return cliparse.parsers.error("The number of instances must be between 1 and 20");
    } else {
      return cliparse.parsers.success(parsedInstances);
    }
  }
};

Parsers.date = function(dateString) {
  var date = new Date(dateString);
  if(isNaN(date.getTime())) {
    return cliparse.parsers.error("Invalid date: " + dateString + " (timestamps or IS0 8601 dates are accepted)")
  } else {
    return cliparse.parsers.success(date);
  }
}

var appIdRegex = /^app_[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
Parsers.appIdOrName = function(string) {
  if(string.match(appIdRegex)) {
    return cliparse.parsers.success({ app_id: string});
  } else {
    return cliparse.parsers.success({ app_name: string});
  }
}

var orgaIdRegex = /^orga_[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
Parsers.orgaIdOrName = function(string) {
  if(string.match(orgaIdRegex)) {
    return cliparse.parsers.success({ orga_id: string});
  } else {
    return cliparse.parsers.success({ orga_name: string});
  }
}

var addonIdRegex = /^addon_[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
Parsers.addonIdOrName = function(string) {
  if(string.match(addonIdRegex)) {
    return cliparse.parsers.success({ addon_id: string});
  } else {
    return cliparse.parsers.success({ addon_name: string});
  }
}
