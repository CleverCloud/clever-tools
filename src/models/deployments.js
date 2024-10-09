import { promisify } from 'node:util';
import { Logger } from '../logger.js';
import { getDeployment, getAllDeployments } from '@clevercloud/client/esm/api/v2/application.js';
import { sendToApi } from './send-to-api.js';

const delay = promisify(setTimeout);

const DEPLOYMENT_POLLING_DELAY = 5000;
const BACKOFF_FACTOR = 1.25;
const INIT_RETRY_TIMEOUT = 1500;
const MAX_RETRY_COUNT = 5;

export async function waitForDeploymentStart ({ ownerId, appId, deploymentId, commitId, knownDeployments }) {

  return waitFor(async () => {
    try {

      // In a deploy situation, we don't have the deployment ID so we get the latest deployments,
      // then we match by commit ID and we filter out "known deployments" that existed before the deploy.
      // In a restart situation, we have a deployment ID but fetching it too soon may result in an error so we get latest deployments,
      // then we just match on the deployment ID.
      const deploymentList = await getAllDeployments({ id: ownerId, appId, limit: 5 }).then(sendToApi);
      const deployment = deploymentList.find((d) => {
        if (deploymentId != null) {
          return d.uuid === deploymentId;
        }
        if (commitId != null && Array.isArray(knownDeployments)) {
          const isNew = knownDeployments.every(({ uuid }) => uuid !== d.uuid);
          return isNew && d.commit === commitId;
        }
        return false;
      });
      if (deployment != null) {
        Logger.debug(`Deployment has started (state:${deployment.state})`);
        return deployment;
      }
      Logger.debug('Deployment cannot be found yet');
    }
    catch (e) {
      Logger.debug('Failed to retrieve deployment');
      throw e;
    }
  });
}

export async function waitForDeploymentEnd ({ ownerId, appId, deploymentId }) {
  return waitFor(async () => {
    try {
      const deployment = await getDeployment({ id: ownerId, appId, deploymentId }).then(sendToApi);
      // If it's not WIP, it means it has ended (OK, FAIL, CANCELLED…)
      if (deployment.state !== 'WIP') {
        Logger.debug(`Deployment is finished (state:${deployment.state})`);
        return deployment;
      }
      Logger.debug(`Deployment is not finished yet (state:${deployment.state})`);
    }
    catch (e) {
      Logger.debug('Failed to retrieve current deployment status');
      throw e;
    }
  });
}

// Calls an async function "fetchResult"
// Return fetchResult's result if it's not null
// Retry with simple "infinite polling" if fetchResult succeeds and returns null
// Retry with exponential backoff if fetchResult fails
async function waitFor (fetchResult) {

  let failCount = 0;

  while (true) {

    try {

      const result = await fetchResult();
      if (result != null) {
        return result;
      }

      // Reset fail count, we only use it to limit failed API calls
      failCount = 0;

      // Retry with simple polling when API calls succeed
      await delay(DEPLOYMENT_POLLING_DELAY);
    }
    catch (e) {
      // If only retry if it's a network error
      if (e.code !== 'EAI_AGAIN') {
        throw e;
      }

      // Increment fail count so we don't retry more than MAX_RETRY_COUNT
      failCount += 1;
      if (failCount > MAX_RETRY_COUNT) {
        throw new Error(`Failed ${MAX_RETRY_COUNT} times!`);
      }

      // If API call fails, retry with an exponential backoff
      await delay(INIT_RETRY_TIMEOUT * (BACKOFF_FACTOR ** failCount));
    }
  }
}
