import { defineCommand } from '../../lib/define-command.js';
import { k8sGetNodeGroup } from '../../lib/k8s.js';
import { Logger } from '../../logger.js';
import { humanJsonOutputFormatOption, orgaIdOrNameOption } from '../global.options.js';
import { k8sIdOrNameArg, k8sNodeGroupIdOrNameArg } from './k8s.args.js';

export const k8sNodeGroupGetCommand = defineCommand({
  description: 'Get information about a Kubernetes node group',
  since: '4.9.0',
  options: {
    org: orgaIdOrNameOption,
    format: humanJsonOutputFormatOption,
  },
  args: [k8sIdOrNameArg, k8sNodeGroupIdOrNameArg],
  async handler(options, clusterIdOrName, nodeGroupIdOrName) {
    const { format, org: orgIdOrName } = options;
    const nodeGroup = await k8sGetNodeGroup(orgIdOrName, clusterIdOrName, nodeGroupIdOrName);

    switch (format) {
      case 'json':
        Logger.printJson(nodeGroup);
        break;
      case 'human':
      default: {
        const overview = {
          Name: nodeGroup.name,
          ID: nodeGroup.id,
          Status: nodeGroup.status,
          Flavor: nodeGroup.flavor,
          Nodes: `${nodeGroup.currentNodeCount}/${nodeGroup.targetNodeCount}`,
          Autoscaling: nodeGroup.autoscalingEnabled ? 'enabled' : 'disabled',
          'Min / Max': `${nodeGroup.minNodeCount} / ${nodeGroup.maxNodeCount}${nodeGroup.autoscalingEnabled ? '' : ' (inactive)'}`,
          Created: formatDate(nodeGroup.createdAt),
        };
        const createdFmt = formatDate(nodeGroup.createdAt);
        const updatedFmt = formatDate(nodeGroup.updatedAt);
        if (nodeGroup.updatedAt && updatedFmt !== createdFmt) {
          overview.Updated = updatedFmt;
        }
        if (nodeGroup.description) overview.Description = nodeGroup.description;
        if (nodeGroup.tag) overview.Tag = nodeGroup.tag;
        console.table(overview);

        const labels = Object.entries(nodeGroup.labels ?? {});
        if (labels.length > 0) {
          Logger.println('');
          Logger.println(`🏷️  Labels (${labels.length})`);
          console.table(Object.fromEntries(labels.map(([k, v]) => [k, { Value: v }])));
        }

        const taints = nodeGroup.taints ?? [];
        if (taints.length > 0) {
          Logger.println('');
          Logger.println(`🚫 Taints (${taints.length})`);
          console.table(Object.fromEntries(taints.map((t) => [t.key, { Value: t.value ?? '-', Effect: t.effect }])));
        }
        break;
      }
    }
  },
});

function formatDate(iso) {
  if (iso == null) return '-';
  return `${iso.slice(0, 16).replace('T', ' ')}Z`;
}
