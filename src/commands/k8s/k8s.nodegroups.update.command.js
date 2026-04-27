import { z } from 'zod';
import { defineCommand } from '../../lib/define-command.js';
import { defineOption } from '../../lib/define-option.js';
import { k8sUpdateNodeGroup } from '../../lib/k8s.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import { orgaIdOrNameOption } from '../global.options.js';
import { k8sIdOrNameArg, k8sNodeGroupIdOrNameArg } from './k8s.args.js';

export const k8sNodeGroupUpdateCommand = defineCommand({
  description: 'Update a node group on a Kubernetes cluster',
  since: 'unreleased',
  options: {
    count: defineOption({
      name: 'count',
      schema: z.coerce.number().int().min(0).max(256).optional(),
      description: 'Target node count',
      placeholder: 'count',
    }),
    min: defineOption({
      name: 'min',
      schema: z.coerce.number().int().min(0).max(256).optional(),
      description: 'Minimum node count (autoscaling bound)',
      placeholder: 'min',
    }),
    max: defineOption({
      name: 'max',
      schema: z.coerce.number().int().min(0).max(256).optional(),
      description: 'Maximum node count (autoscaling bound)',
      placeholder: 'max',
    }),
    autoscaling: defineOption({
      name: 'autoscaling',
      schema: z.boolean().default(false),
      description: 'Enable the cluster autoscaler',
    }),
    disableAutoscaling: defineOption({
      name: 'disable-autoscaling',
      schema: z.boolean().default(false),
      description: 'Disable the cluster autoscaler',
    }),
    description: defineOption({
      name: 'description',
      schema: z.string().max(4096).optional(),
      description: 'Free-form node group description',
      placeholder: 'description',
    }),
    tag: defineOption({
      name: 'tag',
      schema: z.string().max(1024).optional(),
      description: 'Arbitrary tag attached to the node group',
      placeholder: 'tag',
    }),
    org: orgaIdOrNameOption,
  },
  args: [k8sIdOrNameArg, k8sNodeGroupIdOrNameArg],
  async handler(options, clusterIdOrName, nodeGroupIdOrName) {
    const { org: orgIdOrName } = options;

    if (options.autoscaling && options.disableAutoscaling) {
      throw new Error('--autoscaling and --disable-autoscaling are mutually exclusive');
    }

    const updates = {};
    if (options.count != null) updates.targetNodeCount = options.count;
    if (options.min != null) updates.minNodeCount = options.min;
    if (options.max != null) updates.maxNodeCount = options.max;
    if (options.autoscaling) updates.autoscalingEnabled = true;
    if (options.disableAutoscaling) updates.autoscalingEnabled = false;
    if (options.description != null) updates.description = options.description;
    if (options.tag != null) updates.tag = options.tag;

    if (Object.keys(updates).length === 0) {
      throw new Error(
        'No update specified. Provide at least one of --count, --min, --max, --autoscaling, --disable-autoscaling, --description, --tag',
      );
    }

    if (updates.minNodeCount != null && updates.maxNodeCount != null && updates.minNodeCount > updates.maxNodeCount) {
      throw new Error('--min must be less than or equal to --max');
    }

    const nodeGroup = await k8sUpdateNodeGroup(orgIdOrName, clusterIdOrName, nodeGroupIdOrName, updates);
    Logger.printSuccess(`Node group ${styleText('green', nodeGroup.name)} updated`);
  },
});
