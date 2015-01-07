function run(api) {
  var app = require("./app.js");
  var login = require("./login.js");
  var push = require("./push.js");

  var argv = require("yargs").argv;

  switch(argv._[0]) {
    case "app":
      switch(argv._[1]) {
        case "create":
          app.create(api, argv);
          break;
      }
      break;
    case "login":
      login(api);
      break;
    case "push":
      push(api, argv);
      break;
  }
}

var s_api = require("./models/api.js")();
s_api.onValue(run);
s_api.onError(console.error.bind(console));
