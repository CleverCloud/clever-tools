var path = require("path");

var _ = require("lodash");
var Bacon = require("baconjs");

function fakeLogApi() {
  var WebSocketServer = require("ws").Server;

  return Bacon.fromBinder(function(sink) {
    var authorized = false;

    var wss = new WebSocketServer({port: 12345}, function() {
      sink(new Bacon.Next(wss));
    });

    setTimeout(function() {
      if(!authorized) {
        console.error("No authentication message received. Close the socket.");
        wss.close();
      }
    }, 2000);

    wss.on("connection", function(ws) {
      ws.on("message", function(message) {
        var json = JSON.parse(message);
        if(json.message_type == "oauth" && json.authorization == "AUTHORIZATION") {
          authorized = true;
          ws.send(JSON.stringify({
            "_index": "customers",
            "_type": "syslog",
            "_id": "uvbsPlTWSpaC8WiQjLswPw",
            "_score": null,
            "_source": {
              "message": "Received signal 15; terminating.",
              "@version": "1",
              "@timestamp": "2015-01-06T18:10:37.606Z",
              "host": "62411bb9-40ee-4cf0-aab8-a82e21d057e4",
              "type": "syslog",
              "tags": ["tcp", "syslog", "customers"],
              "syslog_pri": "38",
              "syslog_program": "sshd",
              "syslog_pid": "186",
              "syslog_severity_code": 6,
              "syslog_facility_code": 4,
              "syslog_facility": "security/authorization",
              "syslog_severity": "informational",
              "appId": "app_1246f211-d4a7-4787-ba62-56c163a8b4ef",
              "@source": "195.154.183.92:57269",
              "@source_host": "62411bb9-40ee-4cf0-aab8-a82e21d057e4",
              "@message": "Received signal 15; terminating."
            },
            "sort": [1420567837606]
          }));
        }
      });
    });

    return function(){
      wss.close();
    };
  });
}

describe("log", function() {
  var conf;
  var log;
  var wss;
  var unsubscribe;

  beforeEach(function(done) {
    conf = require("../src/models/configuration.js");
    conf.LOG_URL = "ws://127.0.0.1:12345/logs-socket/<%- appId %>?since=<%- timestamp %>";

    log = require("../src/models/log.js");
    unsubscribe = fakeLogApi().onValue(function(server) {
      wss = server;
      done();
    });
  });

  afterEach(function(done) {
    unsubscribe();
    done();
  });

  it("should get the correct log URL", function() {
    var t = new Date().toISOString();
    expect(log.getLogUrl("app_12345", t)).toBe("ws://127.0.0.1:12345/logs-socket/app_12345?since=" + t);
  });

  it("should be able to fetch some logs", function(done) {
    var s_logs = log.getAppLogs("app_12345", "AUTHORIZATION");
    var context = this;

    s_logs.subscribe(function(event) {
      context.expect(event.hasValue()).toBe(true);
      context.expect(event.value()._source["@message"]).toBe("Received signal 15; terminating.");
      done();

      return Bacon.noMore;
    });
  });
});
