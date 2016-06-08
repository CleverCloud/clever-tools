var path = require("path");
var Bacon = require("baconjs");
var expect = require('chai').expect;

describe("configuration", function() {
  var conf;

  beforeEach(function() {
    conf = require("../src/models/configuration.js");
  });

  it("should retrieve configuration in a JSON file", function(done) {
    conf.CONFIGURATION_FILE = path.resolve(__dirname, "./configuration.json");

    var s_oauth_data = conf.loadOAuthConf();

    s_oauth_data.subscribe(function(event) {
      expect(event.hasValue()).to.equal(true);
      expect(event.value().token).to.equal("aaaa");
      expect(event.value().secret).to.equal("bbbb");
      done();

      return Bacon.noMore;
    });
  });

  it("should return an empty configuration if the configuration file does not exist", function(done) {
    conf.CONFIGURATION_FILE = path.resolve(__dirname, "./configuration-that-does-not-exist.json");

    var s_oauth_data = conf.loadOAuthConf();

    s_oauth_data.subscribe(function(event) {
      expect(event.hasValue()).to.equal(true);
      expect(event.value().token).to.be.an('undefined');
      expect(event.value().secret).to.be.an('undefined');
      done();

      return Bacon.noMore;
    });
  });
});
