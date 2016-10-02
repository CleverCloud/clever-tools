var _ = require("lodash");

var processApiError = function(error) {
  if(error.id && error.message) {
    var line = error.message + " [" + error.id + "]";
    if(error.fields) {
      line += "\n" + Object.keys(error.fields).map(function(field) {
        return field + ": " + error.fields[field];
      }).join("\n");
    }
    return line;
  } else {
    return error;
  }
};

// For each severity, print "[SEVERITY] <message>"
var Logger = _.reduce(["debug", "info", "warn", "error"], function(logger, severity) {
  var f = console[severity] || console.log;
  if(!process.env["CLEVER_QUIET"] && (process.env["CLEVER_VERBOSE"] || (severity !== "debug" && severity !== "info"))) {
    logger[severity] = _.flowRight(_.partial(f.bind(console), "[" + severity.toUpperCase() + "]"), processApiError);
  } else {
    logger[severity] = function() {};
  }
  return logger;
}, module.exports);

// No decoration for Logger.println
Logger.println = console.log.bind(console.log);

// No decoration for Logger.printErrorLine
Logger.printErrorLine = console.error.bind(console.error);

// Only exported for testing, shouldn't be used directly
Logger.processApiError = processApiError;

