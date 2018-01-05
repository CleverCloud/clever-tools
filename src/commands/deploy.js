"use strict";

var path = require("path");

var _ = require("lodash");
var Bacon = require("baconjs");

var AppConfig = require("../models/app_configuration.js");
var Application = require("../models/application.js");
var Git = require("../models/git.js")(path.resolve("."));
var Log = require("../models/log.js");
var Event = require("../models/events.js");

var Logger = require("../logger.js");

var timeout = 5 * 60 * 1000;

var deploy = module.exports;

deploy.deploy = function(api, params) {
  const { alias, branch, commit, quiet, force } = params.options;

  const s_appData = AppConfig.getAppData(alias).toProperty();
  const s_commitId = Git.getCommitId(branch).toProperty();

  const s_remote = s_appData.flatMapLatest(({ alias, deploy_url }) => {
    return Git.createRemote(alias, deploy_url).toProperty();
  }).toProperty();

  const s_fetch = s_remote.flatMapLatest((remote) => {
    return Git.keepFetching(timeout, remote);
  }).toProperty();

  const s_push = s_fetch.flatMapLatest((remote) => {
    Logger.println("Pushing source code to Clever Cloud.");
    return Git.push(remote, branch, s_commitId, force);
  }).toProperty();

  const s_deploy = s_push.flatMapError((error) => {
    if(error.message && error.message.trim() === "error authenticating:"){
      return new Bacon.Error(error.message.trim() + " Did you add your ssh key ?");
    } else {
      return new Bacon.Error(error);
    }
  }).toProperty();

  s_deploy.onValue(function() {
    Logger.println("Your source code has been pushed to Clever Cloud.");
  });

  handleDeployment(api, s_appData, s_deploy, s_commitId, quiet);
};

deploy.restart = function(api, params) {
  const { alias, quiet, commit, 'without-cache': withoutCache } = params.options

  const s_fullCommitId = (commitId == null) ?
    Bacon.constant(null) :
    Git.resolveFullCommitId(commit).flatMapError((e) => {
      return new Bacon.Error(`Commit id ${commit} is ambiguous`);
    });

  const s_appData = AppConfig.getAppData(alias).toProperty();
  const s_commitId = s_appData
    .flatMapLatest(({ app_id, app_orga }) => Application.get(api, app_id, app_orga))
    .flatMapLatest(({ commitId }) => commitId);

  const s_deploy = Bacon
    .combineAsArray(s_appData, s_fullCommitId)
    .flatMapLatest(([appData, fullCommitId]) => {
      let suffix = "";
      if(fullCommitId) suffix += " on commit #" + fullCommitId;
      if(withoutCache) suffix += " without using cache";

      Logger.println("Restarting " + appData.name + suffix);

      return Application.redeploy(api, appData.app_id, appData.org_id, fullCommitId, withoutCache);
    })
    .toProperty();

  handleDeployment(api, s_appData, s_deploy, s_commitId, quiet);
};

var handleDeployment = function(api, s_appData, s_deploy, s_commitId, quiet) {
  s_deploy.onValue(function(v) {
    const deploymentId = v && v.deploymentId;

    var s_deploymentEvents = s_appData.flatMapLatest((appData) => {
      const s_allEvents = Event.getEvents(api, appData.app_id);
      if(deploymentId) {
        return s_allEvents.filter(e => e.data && e.data.uuid === deploymentId);
      } else {
        return s_commitId.flatMapLatest((commitId) => {
          return s_allEvents.filter(e => e.data && e.data.commit === commitId);
        })
      }
    });

    const s_deploymentStart = s_deploymentEvents.filter(e => e.event === 'DEPLOYMENT_ACTION_BEGIN').first().toProperty();

    s_deploymentStart.onValue(function(e) {
      Logger.println("Deployment started".bold.blue);
    });

    // We ignore cancellation events triggered by a git push, are they are always
    // generated even though a deployment is not in progress. Since we match events
    // with commit id in a case of a git push, it makes the program stop before the
    // actual deployment.
    const s_deploymentEnd = s_deploymentEvents
      .filter(e => e.event === 'DEPLOYMENT_ACTION_END')
      .filter(e => deploymentId || (e.data.state !== 'CANCELLED' || e.data.cause !== 'Git'))
      .first();

    s_deploymentEnd.onValue(function(e) {
      if(e.data.state === 'OK') {
        if(quiet) {
          Logger.println('Deployment successful'.bold.green);
        }
        process.exit(0);
      } else {
        if(quiet) {
          Logger.println('Deployment failed. Please check the logs'.bold.red);
        }
        process.exit(1);
      }
    });

    if(!quiet) {
      var s_app = s_appData
        .flatMapLatest(function(appData) {
          Logger.debug("Fetching application information…")
          return Application.get(api, appData.app_id);
        });

      var s_logs = s_app.flatMapLatest(function(app) {
        let s_deploymentId;
        if(deploymentId) {
          s_deploymentId = Bacon.constant(deploymentId);
        } else {
          s_deploymentId = s_deploymentStart.map(e => e.data.uuid);
        }
        Logger.debug("Fetch application logs…");
        return s_deploymentId.flatMapLatest((did) => Log.getAppLogs(api, app.id, null, null, new Date(), null, did));
      });

      s_logs.onValue(Logger.println);
      s_logs.onError(Logger.error);
    }
  });

  s_deploy.onError(Logger.error);
};
