import { defineCommand } from '../../lib/define-command.js';
import { getK8sCluster } from '../../lib/k8s.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import { humanJsonOutputFormatOption, orgaIdOrNameOption } from '../global.options.js';
import { k8sIdOrNameArg } from './k8s.args.js';

export const k8sGetCommand = defineCommand({
  description: 'Get information about a Kubernetes cluster',
  since: '4.3.0',
  options: {
    org: orgaIdOrNameOption,
    format: humanJsonOutputFormatOption,
  },
  args: [k8sIdOrNameArg],
  async handler(options, clusterIdOrName) {
    const { format, org: orgIdOrName } = options;

    const k8sInfo = await getK8sCluster(orgIdOrName, clusterIdOrName);

    switch (format) {
      case 'json':
        Logger.printJson(k8sInfo);
        break;
      case 'human':
      default: {
        const topo = k8sInfo.topologyConfig;
        const overview = {
          Name: k8sInfo.name,
          ID: k8sInfo.id,
          Status: k8sInfo.status,
          Version: k8sInfo.version,
          Topology: topo != null ? `${topo.topology} (${topo.flavor}, rf=${topo.replicationFactor})` : '-',
          Autoscaling: k8sInfo.features?.autoscalingEnabled ? 'enabled' : 'disabled',
          'Persistent storage': k8sInfo.features?.csi != null ? 'enabled' : 'disabled',
        };
        if (k8sInfo.tags?.length) overview.Tags = k8sInfo.tags.join(', ');
        if (k8sInfo.description) overview.Description = k8sInfo.description;
        if (k8sInfo.storageUsageBytes != null) {
          overview.Storage = `${Math.round((k8sInfo.storageUsageBytes / 1024 ** 3) * 100) / 100} GB`;
        }
        console.table(overview);

        if (k8sInfo.loadBalancers?.length) {
          Logger.println('');
          Logger.println(`🔀 Load balancers (${k8sInfo.loadBalancers.length})`);
          console.table(
            Object.fromEntries(
              k8sInfo.loadBalancers.map((lb) => [
                lb.id,
                { Flavor: lb.flavor, IPs: lb.ips?.join(', ') ?? '-', Domain: lb.domainName ?? '-' },
              ]),
            ),
          );
        }

        Logger.println('');
        const orgMessageComplement = orgIdOrName ? `--org "${orgIdOrName.orga_id || orgIdOrName.orga_name}"` : '';

        Logger.println(
          `Once ACTIVE, get the kubeconfig with ${styleText('blue', `clever k8s get-kubeconfig ${k8sInfo.id} ${orgMessageComplement}`)}`,
        );
        break;
      }
    }
  },
});
