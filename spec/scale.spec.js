var path = require("path");

var _ = require("lodash");
var Bacon = require("baconjs");

var Application = require("../src/models/application.js");

var defaultInstance = {
  minFlavor: "S",
  maxFlavor: "S",
  minInstances: 5,
  maxInstances: 5
};

var defaultScalabilityParameters = {
  minFlavor: null,
  maxFlavor: null,
  minInstances: null,
  maxInstances: null
};

describe("scale-merge-parameters", function() {

  it("should scale up max scalability", function() {
    var instance = _.clone(defaultInstance);
    var scalabilityParameters = _.clone(defaultScalabilityParameters);

    scalabilityParameters.minFlavor = "M";

    instance = Application.mergeScalabilityParameters(scalabilityParameters, instance);
    expect(instance.maxFlavor).toBe("M");
  });

  it("should scale down min scalability", function() {
    var instance = _.clone(defaultInstance);
    var scalabilityParameters = _.clone(defaultScalabilityParameters);

    scalabilityParameters.maxFlavor = "XS";

    instance = Application.mergeScalabilityParameters(scalabilityParameters, instance);
    expect(instance.minFlavor).toBe("XS");
  });

  it("should augment max instances", function() {
    var instance = _.clone(defaultInstance);
    var scalabilityParameters = _.clone(defaultScalabilityParameters);

    scalabilityParameters.minInstances = 6;

    instance = Application.mergeScalabilityParameters(scalabilityParameters, instance);
    expect(instance.maxInstances).toBe(6);
  });

  it("should diminue min instances", function() {
    var instance = _.clone(defaultInstance);
    var scalabilityParameters = _.clone(defaultScalabilityParameters);

    scalabilityParameters.maxInstances = 4;

    instance = Application.mergeScalabilityParameters(scalabilityParameters, instance);
    expect(instance.minInstances).toBe(4);
  });
});
