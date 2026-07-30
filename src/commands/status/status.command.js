import { GetDeploymentCommand } from '@clevercloud/client/cc-api-commands/deployment/get-deployment-command.js';
import { ListApplicationInstanceCommand } from '@clevercloud/client/cc-api-commands/instance/list-application-instance-command.js';
import { tolerateNotFound } from '@clevercloud/client/utils/error-utils.js';
import _ from 'lodash';
import { defineCommand } from '../../lib/define-command.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import * as Application from '../../models/application.js';
import { clients } from '../../models/cc-api-client.js';
import { aliasOption, appIdOrNameOption, humanJsonOutputFormatOption } from '../global.options.js';

function displayInstances(instances, commit) {
  return `(${instances.map((instance) => `${instance.count}*${instance.flavor}`)},  Commit: ${commit || 'N/A'})`;
}

// The v4 instance API does not expose the commit anymore, we get it from the instances' deployment
async function getDeploymentCommit(ownerId, applicationId, deploymentId) {
  if (deploymentId == null) {
    return undefined;
  }
  const deployment = await tolerateNotFound(
    clients.ccApi.send(new GetDeploymentCommand({ ownerId, applicationId, deploymentId })),
  );
  return deployment?.version?.commitId;
}

async function computeStatus(instances, app, ownerId) {
  const upInstances = _.filter(instances, ({ state }) => state === 'UP');
  const isUp = !_.isEmpty(upInstances);

  const deployingInstances = _.filter(instances, ({ state }) => state === 'DEPLOYING');
  const isDeploying = !_.isEmpty(deployingInstances);

  const [upCommit, deployingCommit] = await Promise.all([
    getDeploymentCommit(ownerId, app.id, upInstances[0]?.deploymentId),
    getDeploymentCommit(ownerId, app.id, deployingInstances[0]?.deploymentId),
  ]);

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
    separateBuild: app.hasSeparatedBuild,
    buildFlavor: app.buildFlavor?.name,
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
    .groupBy((i) => i.flavor)
    .map((instances, flavorName) => ({
      flavor: flavorName,
      count: instances.length,
    }))
    .value();
}

export const statusCommand = defineCommand({
  description: 'See the status of an application',
  since: '0.2.0',
  options: {
    alias: aliasOption,
    app: appIdOrNameOption,
    format: humanJsonOutputFormatOption,
  },
  args: [],
  async handler(options) {
    const { alias, app: appIdOrName, format } = options;
    const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

    const instances = await clients.ccApi.send(
      new ListApplicationInstanceCommand({ ownerId, applicationId: appId, excludeState: ['DELETED'] }),
    );
    const app = await Application.get(ownerId, appId);

    const status = await computeStatus(instances, app, ownerId);

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
