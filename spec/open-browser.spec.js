var path = require("path");
var Bacon = require("baconjs");
var expect = require('chai').expect;

var OpenBrowser = require('../src/open-browser.js');

describe("open-browser", function() {
  it("should generate the right command to open a URL", function(done) {
    var url = "http://example.org/test"
    var s_command = OpenBrowser.getCommand(url);
    s_command.subscribe(function(event) {
      expect(event.hasValue()).to.equal(true);
      expect(event.value().args).to.deep.equal([url]);
      done();

      return Bacon.noMore;
    });
  });

  it("raise an error if the provided url is malformed", function(done) {
    var url = undefined;
    var s_command = OpenBrowser.getCommand(url);
    expect(s_command.hasValue()).to.equal(false);
    done();
  });

  it("raise an error if the provided url is relative", function(done) {
    var url = "/test.html";
    var s_command = OpenBrowser.getCommand(url);
    expect(s_command.hasValue()).to.equal(false);
    done();
  });
});
