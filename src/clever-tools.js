var API_AUTHORIZATION = 'OAuth realm="http://ccapi.cleverapps.io/v2/oauth", oauth_consumer_key="DVXgEDKLATkZkSRqN7iQ0KwWSvtNaD", oauth_token="d972d01ecae4410c9c2453073f8f3a0c", oauth_signature_method="PLAINTEXT", oauth_signature="GPKbDuphYWFr3faS5dg64eCjsrpxGY&8464acaf74704c07ac9c6a51c51da9c1", oauth_timestamp="1420464897", oauth_nonce="848269"';

var api = require("clever-client")({
  API_HOST: "https://api.clever-cloud.com/v2",
  API_AUTHORIZATION: API_AUTHORIZATION
});

// Waiting for clever-client to be fully node compliant
api.session.getAuthorization = function() {
  return API_AUTHORIZATION;
};

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
