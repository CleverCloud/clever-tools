import { defineCommand } from '../../lib/define-command.js';
import { k8sListNodeGroups } from '../../lib/k8s.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import { humanJsonOutputFormatOption, orgaIdOrNameOption } from '../global.options.js';
import { k8sIdOrNameArg } from './k8s.args.js';

export const k8sNodeGroupListCommand = defineCommand({
  description: 'List the node groups of a Kubernetes cluster',
  since: '4.9.0',
  options: {
    org: orgaIdOrNameOption,
    format: humanJsonOutputFormatOption,
  },
  args: [k8sIdOrNameArg],
  async handler(options, clusterIdOrName) {
    const { format, org: orgIdOrName } = options;
    const nodeGroups = await k8sListNodeGroups(orgIdOrName, clusterIdOrName);

    switch (format) {
      case 'json':
        Logger.printJson(nodeGroups);
        break;
      case 'human':
      default:
        if (nodeGroups.length === 0) {
          Logger.println(
            `🔎 No node group found, create one with ${styleText('blue', 'clever k8s nodegroups create')}`,
          );
          return;
        }
        console.table(
          Object.fromEntries(
            nodeGroups.map((ng) => [
              ng.id,
              {
                Name: ng.name,
                Status: ng.status,
                Flavor: ng.flavor,
                Nodes: `${ng.currentNodeCount}/${ng.targetNodeCount}`,
                Autoscaling: ng.autoscalingEnabled ? `${ng.minNodeCount}-${ng.maxNodeCount}` : 'disabled',
              },
            ]),
          ),
        );
        break;
    }
  },
});
