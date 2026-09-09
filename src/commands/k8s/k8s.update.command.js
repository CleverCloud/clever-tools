import { z } from 'zod';
import { defineCommand } from '../../lib/define-command.js';
import { defineOption } from '../../lib/define-option.js';
import {
  NODE_AUTOPROVISIONING_HINT,
  buildClusterFeaturesPatch,
  k8sUpdate,
  processFeaturesError,
} from '../../lib/k8s.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import { tags } from '../../parsers.js';
import { orgaIdOrNameOption } from '../global.options.js';
import { k8sIdOrNameArg } from './k8s.args.js';

export const k8sUpdateCommand = defineCommand({
  description: 'Update a Kubernetes cluster metadata or features',
  since: '4.9.0',
  options: {
    name: defineOption({
      name: 'name',
      schema: z.string().max(128).optional(),
      description: 'Rename the cluster',
      placeholder: 'name',
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
      description: 'Replace tags (comma-separated, e.g.: env:prod,team:platform)',
      placeholder: 'tag[,tag...]',
    }),
    nodeAutoprovisioning: defineOption({
      name: 'node-autoprovisioning',
      schema: z.boolean().default(false),
      description: 'Enable node autoscaling via node auto-provisioning, powered by Karpenter',
    }),
    disableNodeAutoprovisioning: defineOption({
      name: 'disable-node-autoprovisioning',
      schema: z.boolean().default(false),
      description: 'Disable node autoscaling via node auto-provisioning, uninstalls Karpenter',
    }),
    org: orgaIdOrNameOption,
  },
  args: [k8sIdOrNameArg],
  async handler(options, clusterIdOrName) {
    const { org: orgIdOrName } = options;

    const updates = {};
    if (options.name != null) updates.name = options.name;
    if (options.description != null) updates.description = options.description;
    if (options.tag != null) updates.tags = options.tag;

    const features = buildClusterFeaturesPatch(options);
    if (Object.keys(features).length > 0) updates.features = features;

    if (Object.keys(updates).length === 0) {
      throw new Error(
        'No update specified. Provide at least one of --name, --description, --tag, --node-autoprovisioning, --disable-node-autoprovisioning',
      );
    }

    const cluster = await k8sUpdate(orgIdOrName, clusterIdOrName, updates).catch((error) => {
      // Preserve API errors for metadata updates.
      if (features.nodeAutoprovisioning == null) throw error;
      throw processFeaturesError(error, clusterIdOrName, { disabling: options.disableNodeAutoprovisioning });
    });
    Logger.printSuccess(`Cluster ${styleText('green', cluster.name)} updated`);

    if (options.nodeAutoprovisioning) {
      Logger.printInfo(NODE_AUTOPROVISIONING_HINT);
    }
    if (options.disableNodeAutoprovisioning) {
      Logger.printInfo('Karpenter is being uninstalled from the cluster');
    }
  },
});
