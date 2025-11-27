import { defineCommand } from '../../lib/define-command.js';
import { getK8sCluster } from '../../lib/k8s.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import { humanJsonOutputFormatFlag, orgaIdOrNameFlag } from '../global.flags.js';
import { k8sIdOrNameArg } from './k8s.args.js';

export const k8sGetCommand = defineCommand({
  description: 'Get information about a Kubernetes cluster',
  flags: {
    org: orgaIdOrNameFlag,
    format: humanJsonOutputFormatFlag,
  },
  args: [k8sIdOrNameArg],
  async handler(flags, clusterIdOrName) {
    const { format, org: orgIdOrName } = flags;

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
  },
});
