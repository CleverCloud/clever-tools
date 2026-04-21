import { z } from 'zod';
import { typewriterLogo } from '../../lib/ascii.js';
import { defineArgument } from '../../lib/define-argument.js';
import { defineCommand } from '../../lib/define-command.js';
import { defineOption } from '../../lib/define-option.js';
import { getK8sCluster, k8sCreate, k8sGetProduct } from '../../lib/k8s.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import { tags } from '../../parsers.js';
import { orgaIdOrNameOption } from '../global.options.js';

const DEPLOY_POLL_DELAY_MS = 10000;

export const k8sCreateCommand = defineCommand({
  description: 'Create a Kubernetes cluster',
  since: '4.3.0',
  options: {
    clusterVersion: defineOption({
      name: 'cluster-version',
      schema: z.string().optional(),
      description: 'Kubernetes version to deploy (e.g.: 1.33)',
      placeholder: 'cluster-version',
    }),
    description: defineOption({
      name: 'description',
      schema: z.string().max(4096).optional(),
      description: 'Free-form cluster description',
      placeholder: 'description',
    }),
    tag: defineOption({
      name: 'tag',
      schema: z.string().transform(tags).optional(),
      description: 'Semantic tags (comma-separated, e.g.: env:prod,team:platform)',
      placeholder: 'tag[,tag...]',
    }),
    autoscaling: defineOption({
      name: 'autoscaling',
      schema: z.boolean().default(false),
      description: 'Enable the cluster autoscaler',
    }),
    persistentStorage: defineOption({
      name: 'persistent-storage',
      schema: z.boolean().default(false),
      description: 'Enable persistent storage (Ceph CSI)',
    }),
    topology: defineOption({
      name: 'topology',
      schema: z.string().optional(),
      description: 'Cluster topology (must be set with --flavor and --replication-factor)',
      placeholder: 'topology',
      complete: async () => {
        const product = await k8sGetProduct();
        return (product.topologies ?? []).map((t) => t.topology);
      },
    }),
    flavor: defineOption({
      name: 'flavor',
      schema: z.string().optional(),
      description: 'Control plane flavor',
      placeholder: 'flavor',
      complete: async () => {
        const product = await k8sGetProduct();
        const flavors = new Set((product.topologies ?? []).flatMap((t) => t.availableFlavors ?? []));
        return [...flavors];
      },
    }),
    replicationFactor: defineOption({
      name: 'replication-factor',
      schema: z.coerce.number().int().optional(),
      description: 'Control plane replication factor',
      placeholder: 'replication-factor',
    }),
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
      const cluster = await k8sCreate(clusterName, orgIdOrName, {
        version: options.clusterVersion,
        description: options.description,
        tags: options.tag,
        autoscaling: options.autoscaling,
        persistentStorage: options.persistentStorage,
        topology: options.topology,
        flavor: options.flavor,
        replicationFactor: options.replicationFactor,
      });

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
