import { getAllInstances, get as getApplication } from '@clevercloud/client/esm/api/v2/application.js';
import _ from 'lodash';
import { defineCommand } from '../../lib/define-command.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import * as Application from '../../models/application.js';
import { sendToApi } from '../../models/send-to-api.js';
import { aliasOption, appIdOrNameOption, humanJsonOutputFormatOption } from '../global.options.js';

function displayInstances(instances, commit) {
  return `(${instances.map((instance) => `${instance.count}*${instance.flavor}`)},  Commit: ${commit || 'N/A'})`;
}

function computeStatus(instances, app) {
  const upInstances = _.filter(instances, ({ state }) => state === 'UP');
  const isUp = !_.isEmpty(upInstances);
  const upCommit = _(upInstances).map('commit').head();

  const deployingInstances = _.filter(instances, ({ state }) => state === 'DEPLOYING');
  const isDeploying = !_.isEmpty(deployingInstances);
  const deployingCommit = _(deployingInstances).map('commit').head();

  const { minFlavor, maxFlavor, minInstances, maxInstances } = app.instance;

  const scalabilityEnabled = minFlavor.name !== maxFlavor.name || minInstances !== maxInstances;

  const status = {
    id: app.id,
    name: app.name,
    type: {
      name: app.instance.variant.name,
      slug: app.instance.variant.slug,
    },
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

function formatScalability({ min, max }) {
  return min === max ? min.toString() : `${min} to ${max}`;
}

function groupInstances(instances) {
  return _(instances)
    .groupBy((i) => i.flavor.name)
    .map((instances, flavorName) => ({
      flavor: flavorName,
      count: instances.length,
    }))
    .value();
}

export const statusCommand = defineCommand({
  description: 'See the status of an application',
  since: '0.2.0',
  sinceDate: '2015-07-28',
  options: {
    alias: aliasOption,
    app: appIdOrNameOption,
    format: humanJsonOutputFormatOption,
  },
  args: [],
  async handler(options) {
    const { alias, app: appIdOrName, format } = options;
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
        const statusMessage =
          status.status === 'running'
            ? `${styleText(['bold', 'green'], 'running')} ${displayInstances(status.instances, status.commit)}`
            : styleText(['bold', 'red'], 'stopped');

        Logger.println(`${status.name}: ${statusMessage}`);
        Logger.println(`Type: ${status.type.name}`);
        Logger.println(`Executed as: ${styleText('bold', status.lifetime)}`);
        if (status.deploymentInProgress) {
          Logger.println(
            `Deployment in progress ${displayInstances(status.deploymentInProgress.instances, status.deploymentInProgress.commit)}`,
          );
        }
        Logger.println();
        Logger.println('Scalability:');
        Logger.println(
          `  Auto scalability: ${status.scalability.enabled ? styleText('green', 'enabled') : styleText('red', 'disabled')}`,
        );
        Logger.println(`  Scalers: ${styleText('bold', formatScalability(status.scalability.horizontal))}`);
        Logger.println(`  Sizes: ${styleText('bold', formatScalability(status.scalability.vertical))}`);
        Logger.println(
          `  Dedicated build: ${status.separateBuild ? styleText('bold', status.buildFlavor) : styleText('red', 'disabled')}`,
        );
      }
    }
  },
});
