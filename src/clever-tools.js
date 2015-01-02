var api = require("clever-client")({
  API_HOST: "https://api.clever-cloud.com/v2",
  API_AUTHORIZATION: 'OAuth realm="http://ccapi.cleverapps.io/v2/oauth", oauth_consumer_key="JXE50BoFF4npvU0rMNheibuUhJfBiy", oauth_token="801596005f5a48b6ad15f9e24439583b", oauth_signature_method="PLAINTEXT", oauth_signature="pWJeDIPkana9QYajLRByivkWw2hAhh&97f34557bbac4aa894160df9e862114c", oauth_timestamp="1419601743", oauth_nonce="584482"'
});

var app = require("./app.js");
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
  case "push":
    push(api, argv);
    break;
}
