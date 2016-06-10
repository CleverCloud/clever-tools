var exec = require("child_process").exec;
var nodeUrl = require("url");

var _ = require("lodash");
var Bacon = require("baconjs");

var Logger = require("./logger.js");

var OpenBrowser = module.exports;

OpenBrowser.getCommand = function(url) {
  Logger.debug("Get the right command to open a tab in a browser…")

  try {
    var parsed = nodeUrl.parse(url);
    if(parsed.protocol === null || parsed.hostname === null) {
      return new Bacon.Error("Invalid url provided");
    }
  } catch(e) {
    return new Bacon.Error("Invalid url provided");
  }

  switch(process.platform) {
    case "darwin":
      return Bacon.constant("open " + url);
    case "linux":
      return Bacon.constant("xdg-open " + url);
    case "win32":
      return Bacon.constant("start " + url);
    default:
      return new Bacon.Error("Unsupported platform: " + process.platform);
  }
}

OpenBrowser.run = function(command) {
  return Bacon.fromBinder(function(sink) {
    Logger.debug("Opening browser")
    exec(command, function(error, stdout, stderr) {
      // Don't consider output in stderr as a blocking error because of
      // firefox
      if(error) {
        sink(new Bacon.Error(error));
      } else {
        sink(stdout);
      }
      sink(new Bacon.End());
    });

    return function(){};
  });
}

OpenBrowser.openPage = function(url) {
  var s_command = OpenBrowser.getCommand(url);

  return s_command.flatMapLatest(function(command) {
    return OpenBrowser.run(command);
  });
}
