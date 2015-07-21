var _ = require("lodash");

var processApiError = function(error) {
  if(error.id && error.message) {
    return error.message + " [" + error.id + "]";
  } else {
    return error;
  }
};

// For each severity, print "[SEVERITY] <message>"
var Logger = _.foldl(["debug", "info", "warn", "error"], function(logger, severity) {
  var f = console[severity] || console.log;
  if(process.env["CLEVER_VERBOSE"] || (severity !== "debug" && severity !== "info")) {
    logger[severity] = _.compose(_.partial(f.bind(console), "[" + severity.toUpperCase() + "]"), processApiError);
  } else {
    logger[severity] = function() {};
  }
  return logger;
}, module.exports);

// No decoration for Logger.println
Logger.println = console.log.bind(console.log);

// No decoration for Logger.printErrorLine
Logger.printErrorLine = console.error.bind(console.error);
