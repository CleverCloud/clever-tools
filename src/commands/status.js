'use strict';

const _ = require('lodash');
const Bacon = require('baconjs');
const colors = require('colors');

const AppConfig = require('../models/app_configuration.js');
const Application = require('../models/application.js');
const handleCommandStream = require('../command-stream-handler');
const Logger = require('../logger.js');

function displayGroupInfo (instances, commit) {
  return `(${displayFlavors(instances)},  Commit: ${commit || 'N/A'})`;
}

function displayFlavors (instances) {
  return _(instances)
    .groupBy((i) => i.flavor.name)
    .map((instances, flavorName) => `${instances.length}*${flavorName}`)
    .value()
    .join(', ');
}

function computeStatus (instances, app) {
  const upInstances = _.filter(instances, ({ state }) => state === 'UP');
  const isUp = !_.isEmpty(upInstances);
  const upCommit = _(upInstances).map('commit').head();

  const deployingInstances = _.filter(instances, ({ state }) => state === 'DEPLOYING');
  const isDeploying = !_.isEmpty(deployingInstances);
  const deployingCommit = _(deployingInstances).map('commit').head();

  const statusMessage = isUp
    ? `${colors.bold.green('running')} ${displayGroupInfo(upInstances, upCommit)}`
    : colors.bold.red('stopped');

  const statusLine = `${app.name}: ${statusMessage}`;
  const deploymentLine = isDeploying
    ? `Deployment in progress ${displayGroupInfo(deployingInstances, deployingCommit)}`
    : '';

  return [statusLine, deploymentLine].join('\n');
}

function displayScalability ({ minFlavor, maxFlavor, minInstances, maxInstances }) {

  const vertical = (minFlavor.name === maxFlavor.name)
    ? minFlavor.name
    : `${minFlavor.name} to ${maxFlavor.name}`;

  const horizontal = (minInstances === maxInstances)
    ? minInstances
    : `${minInstances} to ${maxInstances}`;

  const enabled = (minFlavor.name === maxFlavor.name)
    || (minInstances === maxInstances);

  return `Scalability:
  Auto scalability: ${enabled ? colors.green('enabled') : colors.red('disabled')}
  Scalers: ${colors.bold(horizontal)}
  Sizes: ${colors.bold(vertical)}`;
}

function status (api, params) {
  const { alias } = params.options;

  const s_status = AppConfig.getAppData(alias)
    .flatMapLatest((appData) => {
      const s_instances = Application.getInstances(api, appData.app_id, appData.org_id);
      const s_app = Application.get(api, appData.app_id, appData.org_id);
      return Bacon.combineAsArray([s_instances, s_app]);
    })
    .map(([instances, app]) => {
      Logger.println(computeStatus(instances, app));
      Logger.println(displayScalability(app.instance));
    });

  handleCommandStream(s_status);
}

module.exports = status;
