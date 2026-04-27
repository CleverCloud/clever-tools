import { z } from 'zod';
import { defineArgument } from '../../lib/define-argument.js';
import { defineCommand } from '../../lib/define-command.js';
import { defineOption } from '../../lib/define-option.js';
import { k8sCreateNodeGroup } from '../../lib/k8s.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import { flavorCount } from '../../parsers.js';
import { orgaIdOrNameOption } from '../global.options.js';
import { k8sIdOrNameArg } from './k8s.args.js';

export const k8sNodeGroupCreateCommand = defineCommand({
  description: 'Create a node group on a Kubernetes cluster',
  since: 'unreleased',
  options: {
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
    autoscaling: defineOption({
      name: 'autoscaling',
      schema: z.boolean().default(false),
      description: 'Enable cluster autoscaler for this node group (requires --min and --max)',
    }),
    min: defineOption({
      name: 'min',
      schema: z.coerce.number().int().min(0).max(256).optional(),
      description: 'Minimum node count when autoscaling is enabled',
      placeholder: 'min',
    }),
    max: defineOption({
      name: 'max',
      schema: z.coerce.number().int().min(0).max(256).optional(),
      description: 'Maximum node count when autoscaling is enabled',
      placeholder: 'max',
    }),
    org: orgaIdOrNameOption,
  },
  args: [
    k8sIdOrNameArg,
    defineArgument({
      schema: z
        .string()
        .regex(
          /^[a-z0-9]([-a-z0-9]{0,61}[a-z0-9])?$/,
          'Must be lowercase RFC 1123 (letters, digits, "-"), start/end alphanumeric, max 63 chars',
        ),
      description: 'Node group name (lowercase RFC 1123, max 63 chars)',
      placeholder: 'nodegroup-name',
    }),
    defineArgument({
      schema: z.string().transform(flavorCount),
      description: 'Node group flavor and target node count (format: <flavor>:<count>, e.g.: XS:3)',
      placeholder: 'flavor:count',
    }),
  ],
  async handler(options, clusterIdOrName, nodeGroupName, spec) {
    const { org: orgIdOrName } = options;
    const nodeGroup = await k8sCreateNodeGroup(orgIdOrName, clusterIdOrName, {
      name: nodeGroupName,
      flavor: spec.flavor,
      targetNodeCount: spec.targetNodeCount,
      description: options.description,
      tag: options.tag,
      autoscaling: options.autoscaling,
      min: options.min,
      max: options.max,
    });
    Logger.println(`🚀 Node group ${styleText('white', `${nodeGroup.name} (${nodeGroup.id})`)} is being deployed`);
  },
});
