import { z } from 'zod';
import { typewriterLogo } from '../../lib/ascii.js';
import { defineArgument } from '../../lib/define-argument.js';
import { defineCommand } from '../../lib/define-command.js';
import { defineOption } from '../../lib/define-option.js';
import { getK8sCluster, k8sCreate } from '../../lib/k8s.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import { orgaIdOrNameOption } from '../global.options.js';

const DEPLOY_POLL_DELAY_MS = 10000;

export const k8sCreateCommand = defineCommand({
  description: 'Create a Kubernetes cluster',
  since: '4.3.0',
  options: {
    watch: defineOption({
      name: 'watch',
      schema: z.boolean().default(false),
      description: 'Watch the deployment until the cluster is deployed',
      aliases: ['w'],
    }),
    org: orgaIdOrNameOption,
  },
  args: [
    defineArgument({
      schema: z.string(),
      description: 'Kubernetes cluster name',
      placeholder: 'cluster-name',
    }),
  ],
  async handler(options, ...args) {
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
  },
});
