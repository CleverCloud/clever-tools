import { defineCommand } from '../../lib/define-command.js';
import { isK8sClusterActive, k8sGetConfig } from '../../lib/k8s.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import { orgaIdOrNameOption } from '../global.options.js';
import { k8sIdOrNameArg } from './k8s.args.js';

export const k8sGetKubeconfigCommand = defineCommand({
  description: 'Get configuration of a Kubernetes cluster',
  since: '4.3.0',
  sinceDate: '2025-10-22',
  options: {
    org: orgaIdOrNameOption,
  },
  args: [k8sIdOrNameArg],
  async handler(options, clusterIdOrName) {
    const orgIdOrName = options.org;

    if ((await isK8sClusterActive(orgIdOrName, clusterIdOrName)) !== true) {
      Logger.printInfo(
        'Kubeconfig can only be retrieved from deployed clusters, wait for the deployment to finish and try again',
      );

      const orgMessageComplement = orgIdOrName ? `--org "${orgIdOrName.orga_id || orgIdOrName.orga_name}"` : '';
      Logger.println(
        `Check with ${styleText('blue', `clever k8s get ${clusterIdOrName.addon_name || clusterIdOrName.operator_id} ${orgMessageComplement}`)}`,
      );
      return;
    }

    console.log(await k8sGetConfig(orgIdOrName, clusterIdOrName));
  },
});
