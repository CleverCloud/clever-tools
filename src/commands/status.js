'use strict';

const _ = require('lodash');
const colors = require('colors/safe');

const AppConfig = require('../models/app_configuration.js');
const Logger = require('../logger.js');

const { get: getApplication, getAllInstances } = require('@clevercloud/client/cjs/api/application.js');
const { sendToApi } = require('../models/send-to-api.js');

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

function displayScalability (app) {

  const { minFlavor, maxFlavor, minInstances, maxInstances } = app.instance;

  const vertical = (minFlavor.name === maxFlavor.name)
    ? minFlavor.name
    : `${minFlavor.name} to ${maxFlavor.name}`;

  const horizontal = (minInstances === maxInstances)
    ? minInstances
    : `${minInstances} to ${maxInstances}`;

  const enabled = (minFlavor.name !== maxFlavor.name)
    || (minInstances !== maxInstances);

  return `Scalability:
  Auto scalability: ${enabled ? colors.green('enabled') : colors.red('disabled')}
  Scalers: ${colors.bold(horizontal)}
  Sizes: ${colors.bold(vertical)}
  Dedicated build: ${app.separateBuild ? colors.bold(app.buildFlavor.name) : colors.red('disabled')}`;
}

async function status (params) {
  const { alias } = params.options;
  const { ownerId, appId } = await AppConfig.getAppDetails({ alias });

  const instances = await getAllInstances({ id: ownerId, appId }).then(sendToApi);
  const app = await getApplication({ id: ownerId, appId }).then(sendToApi);

  Logger.println(computeStatus(instances, app));
  Logger.println(displayScalability(app));
}

module.exports = { status };
