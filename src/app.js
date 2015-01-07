var _ = require("lodash");
var path = require("path");
var Bacon = require("baconjs");
var nodegit = require("nodegit");

var Application = require("./models/application.js");
var Git = require("./models/git.js");

var debug = console.log.bind(console);
var error = _.partial(console.error.bind(console), "[ERROR]");

var app = module.exports = function(api) {
  if(app.subcommands[process.argv[3]]) {
    app.subcommands[process.argv[3]](api);
  }
  else {
    _.each(app.subcommands, function(subcommand) {
      console.error(subcommand.usage);
    });
  }
};

app.subcommands = {};

var create = app.subcommands.create = function(api) {
  var yargs = create.yargs();
  var argv = yargs.argv;

  if(argv.help) {
    yargs.showHelp();
    return;
  }

  var name = argv._[2];
  var region = argv.region;
  var remote = argv.remote;

  var s_type = Application.getInstanceType(api, argv.type);

  var s_app = s_type.flatMapLatest(function(type) {
    return Application.create(api, name, type, region).flatMapLatest(function(app) {
      return Git.createRemote(remote, app.deployUrl).map(app);
    });
  });

  s_app.onValue(function(app) {
    console.log("Your application has been successfully created!");
  });

  s_app.onError(error);
};

create.usage = "Usage: $0 app create <name> -t <type> [-r <region>] [--remote <remote>]";
create.yargs = function() {
  return require("yargs")
    .usage(app.subcommands.create.usage)
    .options("help", {
      alias: "h",
      boolean: true,
      description: "Show an help message"
    })
    .options("type", {
      alias: "t",
      description: "Type of the application"
    })
    .options("region", {
      alias: "r",
      default: "par",
      description: "Region where the application will deploy. Can be par (Paris, France) or mtl (Montréal, Canada)"
    })
    .options("remote", {
      default: "clever",
      description: "Name of the git remote"
    })
    .demand(2)
    .demand(["type"]);
};
