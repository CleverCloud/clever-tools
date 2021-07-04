'use strict';

const _ = require('lodash');
const colors = require('colors/safe');

const AppConfig = require('../models/app_configuration.js');
const Logger = require('../logger.js');

const { get: getApplication, getAllInstances, getAll } = require('@clevercloud/client/cjs/api/v2/application.js');
const { sendToApi } = require('../models/send-to-api.js');
const table = require('text-table');

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

function appStatus (allInstances) {
  return allInstances.map((instances) => {
    const upInstances = _.filter(instances, ({ state }) => state === 'UP');
    const isUp = !_.isEmpty(upInstances);
    // const upCommit = _(upInstances).map('commit').head();

    const deployingInstances = _.filter(instances, ({ state }) => state === 'DEPLOYING');
    const isDeploying = !_.isEmpty(deployingInstances);
    // const deployingCommit = _(deployingInstances).map('commit').head();
    // table doesn't work with multilines
    const statusMessage = isUp
      ? `${colors.bold.green('running')} ${displayFlavors(instances)}`
      : isDeploying
        ? `${colors.bold.yellow('deploying')} ${displayFlavors(deployingInstances)}`
        : colors.bold.red('stopped');

    return statusMessage;
  });

}

function allName (apps) {
  return apps.map((app) => colors.cyan(app.name));
}

function allCommitId (apps) {
  return apps.map((app) => colors.bold.gray(app.commitId ? app.commitId.substr(0, 12) : 'none'));
}

function allAutoScalability (apps) {
  return apps.map((app) => {
    const { minFlavor, maxFlavor, minInstances, maxInstances } = app.instance;
    return (minFlavor.name !== maxFlavor.name) || (minInstances !== maxInstances) ? colors.bold.green('enabled') : colors.bold.red('disabled');
  });
}

function allScalers (apps) {
  return apps.map((app) => {
    const { minInstances, maxInstances } = app.instance;
    return colors.bold.gray(minInstances + (minInstances !== maxInstances ? ' to ' + maxInstances : ''));
  });
}

function allSizes (apps) {
  return apps.map((app) => {
    const { minFlavor, maxFlavor } = app.instance;
    return colors.bold.green(minFlavor.name + (minFlavor.name !== maxFlavor.name ? ' to ' + maxFlavor.name : ''));
  });
}

function allDedicatedBuild (apps) {
  return apps.map((app) => {
    return app.separateBuild ? colors.bold(app.buildFlavor.name) : colors.bold.red('disabled');
  });
}

async function status (params) {
  const { alias, all } = params.options;
  const apps = all ? await getAll({}).then(sendToApi) : [await getApplication(await AppConfig.getAppDetails({ alias })).then(sendToApi)];
  const allInstances = await Promise.all(apps.map(async (app) => {
    return await getAllInstances({ id: app.ownerId, appId: app.id }).then(sendToApi);
  }));
  const output = table([
    ['Name']            .concat(...allName(apps)),
    ['Status']          .concat(...appStatus(allInstances)),
    ['Commit']          .concat(...allCommitId(apps)),
    ['Auto scalability'].concat(...allAutoScalability(apps)),
    ['Scalers']         .concat(...allScalers(apps)),
    ['Sizes']           .concat(...allSizes(apps)),
    ['Dedicated build'] .concat(...allDedicatedBuild(apps)),
  ], {
    hsep: '   ',
    stringLength: (str) => colors.strip(str).length,
  });
  Logger.println(output);
}

module.exports = { status };
