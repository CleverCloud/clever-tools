'use strict';

const _ = require('lodash');
const colors = require('colors/safe');

const Application = require('../models/application.js');
const Logger = require('../logger.js');

const { get: getApplication, getAllInstances } = require('@clevercloud/client/cjs/api/v2/application.js');
const { sendToApi } = require('../models/send-to-api.js');

async function status (params) {
  const { alias, app: appIdOrName, format } = params.options;
  const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

  const instances = await getAllInstances({ id: ownerId, appId }).then(sendToApi);
  const app = await getApplication({ id: ownerId, appId }).then(sendToApi);

  const status = computeStatus(instances, app);

  switch (format) {
    case 'json': {
      Logger.printJson(status);
      break;
    }
    case 'human':
    default: {
      const statusMessage = status.status === 'running'
        ? `${colors.bold.green('running')} ${displayInstances(status.instances, status.commit)}`
        : colors.bold.red('stopped');

      Logger.println(`${status.name}: ${statusMessage}`);
      Logger.println(`Executed as: ${colors.bold(status.lifetime)}`);
      if (status.deploymentInProgress) {
        Logger.println(`Deployment in progress ${displayInstances(status.deploymentInProgress.instances, status.deploymentInProgress.commit)}`);
      }
      Logger.println();
      Logger.println('Scalability:');
      Logger.println(`  Auto scalability: ${status.scalability.enabled ? colors.green('enabled') : colors.red('disabled')}`);
      Logger.println(`  Scalers: ${colors.bold(formatScalability(status.scalability.horizontal))}`);
      Logger.println(`  Sizes: ${colors.bold(formatScalability(status.scalability.vertical))}`);
      Logger.println(`  Dedicated build: ${status.separateBuild ? colors.bold(status.buildFlavor) : colors.red('disabled')}`);
    }
  }
}

function displayInstances (instances, commit) {
  return `(${instances.map((instance) => `${instance.count}*${instance.flavor}`)},  Commit: ${commit || 'N/A'})`;
}

function computeStatus (instances, app) {
  const upInstances = _.filter(instances, ({ state }) => state === 'UP');
  const isUp = !_.isEmpty(upInstances);
  const upCommit = _(upInstances).map('commit').head();

  const deployingInstances = _.filter(instances, ({ state }) => state === 'DEPLOYING');
  const isDeploying = !_.isEmpty(deployingInstances);
  const deployingCommit = _(deployingInstances).map('commit').head();

  const { minFlavor, maxFlavor, minInstances, maxInstances } = app.instance;

  const scalabilityEnabled = (minFlavor.name !== maxFlavor.name)
    || (minInstances !== maxInstances);

  const status = {
    id: app.id,
    name: app.name,
    lifetime: app.instance.lifetime,
    status: isUp ? 'running' : 'stopped',
    commit: upCommit,
    instances: groupInstances(upInstances),
    scalability: {
      enabled: scalabilityEnabled,
      vertical: { min: minFlavor.name, max: maxFlavor.name },
      horizontal: { min: minInstances, max: maxInstances },
    },
    separateBuild: app.separateBuild,
    buildFlavor: app.buildFlavor.name,
  };

  if (isDeploying) {
    status.deploymentInProgress = {
      commit: deployingCommit,
      instances: groupInstances(deployingInstances),
    };
  }

  return status;
}

function formatScalability ({ min, max }) {
  return (min === max) ? min : `${min} to ${max}`;
}

function groupInstances (instances) {
  return _(instances)
    .groupBy((i) => i.flavor.name)
    .map((instances, flavorName) => ({
      flavor: flavorName,
      count: instances.length,
    }))
    .value();
}

module.exports = { status };
