var path = require("path");

var _ = require("lodash");
var Bacon = require("baconjs");
var expect = require('chai').expect;

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
    var instance = _.cloneDeep(defaultInstance);
    var scalabilityParameters = _.cloneDeep(defaultScalabilityParameters);

    scalabilityParameters.minFlavor = "M";

    instance = Application.__mergeScalabilityParameters(scalabilityParameters, instance);
    expect(instance.maxFlavor).to.equal("M");
  });

  it("should scale down min scalability", function() {
    var instance = _.cloneDeep(defaultInstance);
    var scalabilityParameters = _.cloneDeep(defaultScalabilityParameters);

    scalabilityParameters.maxFlavor = "XS";

    instance = Application.__mergeScalabilityParameters(scalabilityParameters, instance);
    expect(instance.minFlavor).to.equal("XS");
  });

  it("should augment max instances", function() {
    var instance = _.cloneDeep(defaultInstance);
    var scalabilityParameters = _.cloneDeep(defaultScalabilityParameters);

    scalabilityParameters.minInstances = 6;

    instance = Application.__mergeScalabilityParameters(scalabilityParameters, instance);
    expect(instance.maxInstances).to.equal(6);
  });

  it("should diminue min instances", function() {
    var instance = _.cloneDeep(defaultInstance);
    var scalabilityParameters = _.cloneDeep(defaultScalabilityParameters);

    scalabilityParameters.maxInstances = 4;

    instance = Application.__mergeScalabilityParameters(scalabilityParameters, instance);
    expect(instance.minInstances).to.equal(4);
  });
});
