var path = require("path");
var Bacon = require("baconjs");

describe("configuration", function() {
  var conf;

  beforeEach(function() {
    conf = require("../src/models/configuration.js");
  });

  it("should retrieve configuration in a JSON file", function(done) {
    conf.CONFIGURATION_FILE = path.resolve(__dirname, "./configuration.json");

    var s_oauth_data = conf.loadOAuthConf();

    s_oauth_data.subscribe(function(event) {
      expect(event.hasValue()).toBe(true);
      expect(event.value().token).toBe("aaaa");
      expect(event.value().secret).toBe("bbbb");
      done();

      return Bacon.noMore;
    });
  });

  it("should return an empty configuration if the configuration file does not exist", function(done) {
    conf.CONFIGURATION_FILE = path.resolve(__dirname, "./configuration-that-does-not-exist.json");

    var s_oauth_data = conf.loadOAuthConf();

    s_oauth_data.subscribe(function(event) {
      expect(event.hasValue()).toBe(true);
      expect(event.value().token).toBeUndefined();
      expect(event.value().secret).toBeUndefined();
      done();

      return Bacon.noMore;
    });
  });
});
