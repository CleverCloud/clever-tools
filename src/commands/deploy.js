'use strict';

const Bacon = require('baconjs');

const AppConfig = require('../models/app_configuration.js');
const Application = require('../models/application.js');
const git = require('../models/git');
const handleCommandStream = require('../command-stream-handler');
const Log = require('../models/log.js');
const Logger = require('../logger.js');

async function deployPromise (api, params) {
  const { alias, branch: branchName, quiet, force } = params.options;

  const appData = await AppConfig.getAppData(alias).toPromise();
  const branchRefspec = await git.getFullBranch(branchName);

  const commitIdToPush = await git.getBranchCommit(branchRefspec);
  const remoteHeadCommitId = await git.getRemoteCommit(appData.deploy_url);
  const deployedCommitId = await Application.get(api, appData.app_id, appData.app_orga).toPromise()
    .then(({ commitId }) => commitId);

  await git.addRemote(appData.alias, appData.deploy_url);

  if (commitIdToPush === remoteHeadCommitId) {
    const upToDateMessage = `The clever-cloud application is up-to-date. Try this command to restart the application:`;
    if (commitIdToPush !== deployedCommitId) {
      throw new Error(`${upToDateMessage}\nclever restart --commit ${commitIdToPush}`);
    }
    throw new Error(`${upToDateMessage}\nclever restart`);
  }

  Logger.println('Pushing source code to Clever Cloud.');
  const push = await git.push(appData.deploy_url, branchRefspec, force);

  Logger.println('Your source code has been pushed to Clever Cloud.');

  return { push, appData, commitIdToPush, quiet };
};

function deploy (api, params) {

  const stream = Bacon
    .fromPromise(deployPromise(api, params))
    .flatMapLatest(({ push, appData, commitIdToPush, quiet }) => {
      return Log.getAllLogs(api, push, appData, commitIdToPush, quiet);
    })
    .map(Logger.println);

  handleCommandStream(stream);
}

module.exports = deploy;
