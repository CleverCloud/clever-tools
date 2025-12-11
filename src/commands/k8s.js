import { typewriterLogo } from '../lib/ascii.js';
import {
  getK8sCluster,
  isK8sClusterActive,
  k8sAddPersistentStorage,
  k8sCreate,
  k8sDelete,
  k8sGetConfig,
  k8sList,
} from '../lib/k8s.js';
import { confirm } from '../lib/prompts.js';
import { styleText } from '../lib/style-text.js';
import { Logger } from '../logger.js';

const DEPLOY_POLL_DELAY_MS = 10000;

export async function create(options, ...args) {
  const clusterName = args[0];
  const orgIdOrName = options.org;

  try {
    const cluster = await k8sCreate(clusterName, orgIdOrName);

    if (options.watch) {
      await typewriterLogo();

      let deployedCluster = cluster;
      while (deployedCluster.status !== 'ACTIVE' && deployedCluster.status !== 'FAILED') {
        Logger.println(
          `⏳ Cluster status: ${styleText('yellow', deployedCluster.status)}. Waiting for ${DEPLOY_POLL_DELAY_MS / 1000}s before checking again...`,
        );
        await new Promise((resolve) => setTimeout(resolve, DEPLOY_POLL_DELAY_MS));

        deployedCluster = await getK8sCluster(orgIdOrName, cluster.id);
      }

      Logger.println('');
      switch (deployedCluster.status) {
        case 'ACTIVE':
          Logger.printSuccess(
            `Cluster ${styleText('green', `${deployedCluster.name} (${deployedCluster.id})`)} deployed successfully`,
          );
          break;
        case 'FAILED':
          throw new Error(
            `Cluster ${styleText('red', `${deployedCluster.name} (${deployedCluster.id})`)} deployment failed`,
          );
        default:
          throw new Error(`Unexpected cluster status: ${deployedCluster.status}`);
      }
    } else {
      Logger.println(`🚀 Cluster ${styleText('white', `${cluster.name} (${cluster.id})`)} is being deployed`);
    }

    const orgMessageComplement = orgIdOrName ? `--org "${orgIdOrName.orga_id || orgIdOrName.orga_name}"` : '';

    Logger.println('');
    Logger.println(
      `You can get its information with ${styleText('blue', `clever k8s get ${cluster.id} ${orgMessageComplement}`)}`,
    );
  } catch (error) {
    if (error.responseBody?.code === 'clever.core.quota-exceeded') {
      throw new Error(
        'Failed to create Kubernetes cluster: your quota exceeded, contact support to increase your quota',
      );
    } else {
      throw new Error(error.message);
    }
  }
}

export async function del(options, clusterIdOrName) {
  const { org: orgIdOrName, yes: confirmDeletion } = options;

  let proceedDeletion;
  if (confirmDeletion) {
    proceedDeletion = true;
  } else {
    proceedDeletion = await confirm(
      `Are you sure you want to delete the Kubernetes cluster ${styleText(
        'blue',
        clusterIdOrName.addon_name || clusterIdOrName.operator_id,
      )}?`,
      'Kubernetes cluster deletion cancelled.',
    );
  }

  if (proceedDeletion) {
    await k8sDelete(orgIdOrName, clusterIdOrName);
    Logger.printSuccess(
      `Kubernetes cluster ${styleText('green', clusterIdOrName.addon_name || clusterIdOrName.operator_id)} successfully deleted`,
    );
  }
}

export async function list(options) {
  const { format, org: orgIdOrName } = options;
  const clusters = await k8sList(orgIdOrName, format);

  switch (format) {
    case 'json':
      Logger.printJson(clusters);
      break;
    case 'human':
    default:
      if (clusters.length === 0) {
        Logger.println(`🔎 No cluster found, create one with ${styleText('blue', `clever k8s create`)} command`);
        return;
      }

      Logger.println(`🔎 Found ${clusters.length} cluster${clusters.length > 1 ? 's' : ''}:`);

      Object.values(clusters).forEach((c) => {
        Logger.println(`  • ${styleText('white', `${c.name} (${c.id})`)} - ${c.status}`);
      });
      break;
  }
}

export async function get(options, clusterIdOrName) {
  const { format, org: orgIdOrName } = options;

  const k8sInfo = await getK8sCluster(orgIdOrName, clusterIdOrName);

  switch (format) {
    case 'json':
      Logger.printJson(k8sInfo);
      break;
    case 'human':
    default:
      console.table({
        Name: k8sInfo.name,
        ID: k8sInfo.id,
        Version: k8sInfo.version,
        Status: k8sInfo.status,
      });

      Logger.println('');
      const orgMessageComplement = orgIdOrName ? `--org "${orgIdOrName.orga_id || orgIdOrName.orga_name}"` : '';

      Logger.println(
        `Once ACTIVE, get the kubeconfig with ${styleText('blue', `clever k8s get-kubeconfig ${k8sInfo.id} ${orgMessageComplement}`)}`,
      );
      break;
  }
}

export async function addPersistentStorage(options, clusterIdOrName) {
  const orgIdOrName = options.org;

  if ((await isK8sClusterActive(orgIdOrName, clusterIdOrName)) === false) {
    Logger.printInfo(
      'Persistent storage can only be added to deployed clusters, wait for the deployment to finish and try again',
    );

    const orgMessageComplement = orgIdOrName ? `--org "${orgIdOrName.orga_id || orgIdOrName.orga_name}"` : '';
    Logger.println(
      `Check with ${styleText('blue', `clever k8s get ${clusterIdOrName.addon_name || clusterIdOrName.operator_id} ${orgMessageComplement}`)}`,
    );
    return;
  }

  try {
    await k8sAddPersistentStorage(orgIdOrName, clusterIdOrName);
    Logger.printSuccess(
      `Persistent storage successfully activated on cluster ${styleText('green', clusterIdOrName.addon_name || clusterIdOrName.operator_id)}`,
    );
  } catch (error) {
    Logger.error("Failed to add persistent storage, check if it's not already activated");
  }
}

export async function getConfig(options, clusterIdOrName) {
  const orgIdOrName = options.org;

  if ((await isK8sClusterActive(orgIdOrName, clusterIdOrName)) !== true) {
    Logger.printInfo(
      'Kubeconfig can only be retrieved from deployed clusters, wait for the deployment to finish and try again',
    );

    const orgMessageComplement = orgIdOrName ? `--org "${orgIdOrName.orga_id || orgIdOrName.orga_name}"` : '';
    Logger.println(
      `Check with ${styleText('blue', `clever k8s get ${clusterIdOrName.addon_name || clusterIdOrName.operator_id} ${orgMessageComplement}`)}`,
    );
    return;
  }

  console.log(await k8sGetConfig(orgIdOrName, clusterIdOrName));
}
