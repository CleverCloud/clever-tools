'use strict';

var expect = require('chai').expect;

var Logger = require("../src/logger.js");

describe("logger.processApiError", function() {

  it("leave unchanged errors not emitted by the CCAPI", function() {
    var error = "Regular error message";
    expect(Logger.processApiError(error)).to.equal("Regular error message");
  });

  it("Display code and message for API errors", function() {
    var error = {
      id: 4002,
      message: "The provided application id doesn't belong to you",
      type: "error"
    };
    expect(Logger.processApiError(error)).to.equal("The provided application id doesn't belong to you [4002]");
  });

  it("Display code, message and fields errors for API errors", function() {
    var error = {
      id: 501,
      message: "Your application did not satisfy our requirements",
      type: "error",
      fields: {
        zone: "Wrong zone",
        other: "Wrong other"
      }
    };
    expect(Logger.processApiError(error)).to.equal(
      "Your application did not satisfy our requirements [501]\n" +
      "zone: Wrong zone\n" +
      "other: Wrong other"
    );
  });
});
