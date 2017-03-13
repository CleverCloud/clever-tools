var spawn = require("child_process").spawn;
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

  var args = [url];

  switch(process.platform) {
    case "darwin":
      return Bacon.constant({command: "open", args: args});
    case "linux":
      return Bacon.constant({command: "xdg-open", args: args});
    case "win32":
      return Bacon.constant({command: "explorer.exe", args: args});
    default:
      return new Bacon.Error("Unsupported platform: " + process.platform);
  }
}

OpenBrowser.run = function(command) {
  return Bacon.fromBinder(function(sink) {
    Logger.debug("Opening browser")
    var browser = spawn(command.command, command.args, {
      detached: true,
      stdio: ['ignore', 'ignore', 'ignore']
    });

    // If we have to launch the browser,
    // unref the child process from the parrent process
    browser.unref();

    sink(new Bacon.Next());
    sink(new Bacon.End());

    return function(){};
  });
}

OpenBrowser.openPage = function(url) {
  var s_command = OpenBrowser.getCommand(url);

  return s_command.flatMapLatest(function(command) {
    return OpenBrowser.run(command);
  });
}
