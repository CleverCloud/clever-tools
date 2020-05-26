'use strict';

var expect = require('chai').expect;

var Parsers = require('../src/parsers.js');

describe("parsers", function() {

  it("should parse dates", function() {
    expect(Parsers.date(1465842774000).success.getTime()).to.equal(new Date(1465842774000).getTime());
    expect(Parsers.date("2016-01-01T00:00:00+02:00").success.getTime()).to.equal(new Date("2016-01-01T00:00:00+02:00").getTime());
    expect(Parsers.date("yolo").success).to.equal(undefined);
  });
  it("should parse appIds", function() {
    expect(Parsers.appIdOrName("app_65b3b15d-3a35-4369-ab8f-28b0293e7b69").success).to.deep.equal({ app_id: "app_65b3b15d-3a35-4369-ab8f-28b0293e7b69" });
  });
  it("should parse app names", function() {
    expect(Parsers.appIdOrName("My great app").success).to.deep.equal({ app_name: "My great app" });
  });
  it("should parse orgaIds", function() {
    expect(Parsers.orgaIdOrName("orga_65b3b15d-3a35-4369-ab8f-28b0293e7b69").success).to.deep.equal({ orga_id: "orga_65b3b15d-3a35-4369-ab8f-28b0293e7b69" });
  });
  it("should parse orga names", function() {
    expect(Parsers.orgaIdOrName("My great organisation").success).to.deep.equal({ orga_name: "My great organisation" });
  });
  it("should parse addonIds", function() {
    expect(Parsers.addonIdOrName("addon_65b3b15d-3a35-4369-ab8f-28b0293e7b69").success).to.deep.equal({ addon_id: "addon_65b3b15d-3a35-4369-ab8f-28b0293e7b69" });
  });
  it("should parse addon names", function() {
    expect(Parsers.addonIdOrName("My great addon").success).to.deep.equal({ addon_name: "My great addon" });
  });
});
