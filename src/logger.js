var _ = require("lodash");

// For each severity, print "[SEVERITY] <message>"
var Logger = _.foldl(["debug", "info", "warn", "error"], function(logger, severity) {
  var f = console[severity] || console.log;
  logger[severity] = _.partial(f.bind(console), "[" + severity.toUpperCase() + "]");
  return logger;
}, module.exports);

// No decoration for Logger.println
Logger.println = console.log.bind(console.log);
