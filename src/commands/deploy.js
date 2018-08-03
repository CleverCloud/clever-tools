'use strict';

const Bacon = require('baconjs');

const AppConfig = require('../models/app_configuration.js');
const Application = require('../models/application.js');
const git = require('../models/git');
const handleCommandStream = require('../command-stream-handler');
const Log = require('../models/log.js');
const Logger = require('../logger.js');

function deploy (api, params) {
  const { alias, branch: branchName, quiet, force } = params.options;

  const s_appData = AppConfig.getAppData(alias).toProperty();
  const s_branchRefspec = git.getFullBranch(branchName).toProperty();

  const s_commitIdToPush = s_branchRefspec.flatMapLatest((branch) => git.getBranchCommit(branch)).toProperty();
  const s_remoteHeadCommitId = s_appData.flatMapLatest(({ deploy_url }) => git.getRemoteCommit(deploy_url)).toProperty();
  const s_deployedCommitId = s_appData
    .flatMapLatest(({ app_id, app_orga }) => Application.get(api, app_id, app_orga))
    .flatMapLatest(({ commitId }) => commitId)
    .toProperty();
  const s_remote = s_appData.flatMapLatest(({ alias, deploy_url }) => git.addRemote(alias, deploy_url)).toProperty();

  const s_allLogs = Bacon.combineAsArray(s_commitIdToPush, s_remoteHeadCommitId, s_deployedCommitId, s_remote)
    .flatMapLatest(([commitIdToPush, remoteCommitId, deployedCommitId]) => {
      if (commitIdToPush === remoteCommitId) {
        const upToDateMessage = `The clever-cloud application is up-to-date. Try this command to restart the application:`;
        if (commitIdToPush !== deployedCommitId) {
          return new Bacon.Error(`${upToDateMessage}\nclever restart --commit ${commitIdToPush}`);
        }
        return new Bacon.Error(`${upToDateMessage}\nclever restart`);
      }
      return s_branchRefspec;
    })
    .flatMapLatest((branchRefspec) => {
      Logger.println('Pushing source code to Clever Cloud.');
      const s_push = s_appData.flatMapLatest(({ deploy_url }) => git.push(deploy_url, branchRefspec, force));
      return Bacon.combineAsArray(s_push, s_appData, s_commitIdToPush);
    })
    .flatMapLatest(([push, appData, commitId]) => {
      Logger.println('Your source code has been pushed to Clever Cloud.');
      return Log.getAllLogs(api, push, appData, commitId, quiet);
    })
    .map(Logger.println);

  handleCommandStream(s_allLogs);
};

module.exports = deploy;
