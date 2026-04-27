import { z } from 'zod';
import { defineCommand } from '../../lib/define-command.js';
import { defineOption } from '../../lib/define-option.js';
import { k8sUpdate } from '../../lib/k8s.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import { tags } from '../../parsers.js';
import { orgaIdOrNameOption } from '../global.options.js';
import { k8sIdOrNameArg } from './k8s.args.js';

export const k8sUpdateCommand = defineCommand({
  description: 'Update a Kubernetes cluster metadata or features',
  since: 'unreleased',
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
    org: orgaIdOrNameOption,
  },
  args: [k8sIdOrNameArg],
  async handler(options, clusterIdOrName) {
    const { org: orgIdOrName } = options;

    if (options.autoscaling && options.disableAutoscaling) {
      throw new Error('--autoscaling and --disable-autoscaling are mutually exclusive');
    }

    const updates = {};
    if (options.name != null) updates.name = options.name;
    if (options.description != null) updates.description = options.description;
    if (options.tag != null) updates.tags = options.tag;

    const features = {};
    if (options.autoscaling) features.autoscalingEnabled = true;
    if (options.disableAutoscaling) features.autoscalingEnabled = false;
    if (Object.keys(features).length > 0) updates.features = features;

    if (Object.keys(updates).length === 0) {
      throw new Error(
        'No update specified. Provide at least one of --name, --description, --tag, --autoscaling, --disable-autoscaling',
      );
    }

    const cluster = await k8sUpdate(orgIdOrName, clusterIdOrName, updates);
    Logger.printSuccess(`Cluster ${styleText('green', cluster.name)} updated`);
  },
});
