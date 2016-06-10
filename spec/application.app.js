var _ = require("lodash");
var Bacon = require("baconjs");

module.exports = function(app) {
  var flavors = [{
    "name": "S",
    "mem": 2048,
    "cpus": 2,
    "disk": null,
    "price": 0.6873000000,
    "available": true
  }, {
    "name": "M",
    "mem": 4096,
    "cpus": 4,
    "disk": null,
    "price": 1.7182000000,
    "available": true
  }, {
    "name": "L",
    "mem": 8192,
    "cpus": 6,
    "disk": null,
    "price": 3.4364000000,
    "available": true
  }, {
    "name": "XL",
    "mem": 16384,
    "cpus": 8,
    "disk": null,
    "price": 6.8729000000,
    "available": true
  }];

  if(app.deploy != "git") {
    return Bacon.once("The deployment type has to be git.");
  }
  else if(!app.description) {
    return Bacon.once("Missing description.");
  }
  else if(!app.instanceType) {
    return Bacon.once("Missing instance type.");
  }
  else if(!app.instanceVersion) {
    return Bacon.once("Missing instance version.");
  }
  else if(_.every(flavors, function(flavor) { return flavor.name != app.maxFlavor; })) {
    return Bacon.once("Invalid max flavor.");
  } 
  else if(_.every(flavors, function(flavor) { return flavor.name != app.minFlavor; })) {
    return Bacon.once("Invalid min flavor.");
  } 
  else if(!app.maxInstances || !app.minInstances) {
    return Bacon.once("Missing scaling configuration.");
  }
  else if(!app.name) {
    return Bacon.once("Missing name.");
  }
  else if(app.zone != "mtl" || app.zone != "par") {
    return Bacon.once("Invalid zone.");
  }
  else {
    return Bacon.once({
      "id": "app_313f9890-6a7b-4267-8afb-1b346930382a",
      "name": app.name,
      "description": app.description,
      "zone": app.zone,
      "instance": {
        "type": app.instanceType,
        "version": app.instanceVersion,
        "minInstances": app.maxInstances,
        "maxInstances": app.minInstances,
        "maxAllowedInstances": 40,
        "minFlavor": _.find(flavors, function(flavor) { return flavor.name == app.minFlavor; }),
        "maxFlavor": _.find(flavors, function(flavor) { return flavor.name == app.maxFlavor; }),
        "flavors": flavors
      },
      "deployment": {
        "shutdownable": false,
        "type": "GIT"
      },
      "vhosts": [, {
        "fqdn": "app-313f9890-6a7b-4267-8afb-1b346930382a.cleverapps.io"
      }],
      "deployUrl": "git+ssh://git@push." + app.zone + ".clever-cloud.com/app_313f9890-6a7b-4267-8afb-1b346930382a.git",
      "creationDate": Date.now(),
      "tags": [],
      "last_deploy": 12,
      "archived": false,
      "stickySessions": false,
      "homogeneous": false,
      "webhookUrl": null,
      "webhookSecret": null
    });
  }
};
