var path = require("path");

var _ = require("lodash");
var Bacon = require("baconjs");
var expect = require('chai').expect;

var Domain = require("../src/models/domain.js");

describe("domain.selectBest", function() {

  it("select a custom domain name above other options", function() {
    var domains = [
      { fqdn: "example.com" },
      { fqdn: "example.cleverapps.io" },
      { fqdn: "app-c677ea0c-0729-4e66-9820-23568be77468.cleverapps.io" }
    ];
    expect(Domain.selectBest(domains)).to.deep.equal({ fqdn: "example.com" });
  });
  it("select a custom cleverapps.io domain name if no custom domain name is available", function() {
    var domains = [
      { fqdn: "example.cleverapps.io" },
      { fqdn: "app_c677ea0c-0729-4e66-9820-23568be77468.cleverapps.io" }
    ];
    expect(Domain.selectBest(domains)).to.deep.equal({ fqdn: "example.cleverapps.io" });
  });
  it("select the default cleverapps.io domain name if nothing else is available", function() {
    var domains = [
      { fqdn: "app_c677ea0c-0729-4e66-9820-23568be77468.cleverapps.io" }
    ];
    expect(Domain.selectBest(domains)).to.deep.equal({ fqdn: "app_c677ea0c-0729-4e66-9820-23568be77468.cleverapps.io" });
  });
  it("return undefined when no domain is available", function() {
    var domains = [];
    expect(Domain.selectBest(domains)).to.equal(undefined);
  });
});
