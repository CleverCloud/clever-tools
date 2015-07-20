var _ = require("lodash");

// For each severity, print "[SEVERITY] <message>"
var Logger = _.foldl(["debug", "info", "warn", "error"], function(logger, severity) {
  var f = console[severity] || console.log;
  if(process.env["CLEVER_VERBOSE"] || (severity !== "debug" && severity !== "info")) {
    logger[severity] = _.partial(f.bind(console), "[" + severity.toUpperCase() + "]");
  } else {
    logger[severity] = function() {};
  }
  return logger;
}, module.exports);

// No decoration for Logger.println
Logger.println = console.log.bind(console.log);

// No decoration for Logger.printErrorLine
Logger.printErrorLine = console.error.bind(console.error);
