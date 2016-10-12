var path = require("path");

var _ = require("lodash");
var Bacon = require("baconjs");
var expect = require('chai').expect;

var notifications = require("../src/commands/notifications.js");

describe("notifications.getEmailNotificationTargets", function() {

  it("handle default case", function() {
    var input = {options: {}};
    var output = notifications.getEmailNotificationTargets(input);
    var expected = [];
    expect(output).to.deep.equal(expected);
  });

  it("handle single user id", function() {
    var input = {options: { "notify": "user_20ebac08-8531-4296-98c9-8dbc7abcd3f4"}};
    var output = notifications.getEmailNotificationTargets(input);
    var expected = [ { "type": "userid", "target": "user_20ebac08-8531-4296-98c9-8dbc7abcd3f4" } ];
    expect(output).to.deep.equal(expected);
  });

  it("handle single email address", function() {
    var input = {options: { "notify": "test@example.org" }};
    var output = notifications.getEmailNotificationTargets(input);
    var expected = [ { "type": "email", "target": "test@example.org" } ];
    expect(output).to.deep.equal(expected);
  });

  it("handle single organisation token", function() {
    var input = {options: { "notify": "organisation" }};
    var output = notifications.getEmailNotificationTargets(input);
    var expected = [ { "type": "organisation" } ];
    expect(output).to.deep.equal(expected);
  });

  it("handle mixed targets", function() {
    var input = {options: { "notify": "organisation,test@example.org,user_20ebac08-8531-4296-98c9-8dbc7abcd3f4" }};
    var output = notifications.getEmailNotificationTargets(input);
    var expected = [
      { "type": "organisation" },
      { "type": "email", "target": "test@example.org" },
      { "type": "userid", "target": "user_20ebac08-8531-4296-98c9-8dbc7abcd3f4" }
    ];
    expect(output).to.deep.equal(expected);
  });
});
