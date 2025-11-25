import { defineCommand } from '../../lib/define-command.js';
import { isK8sClusterActive, k8sGetConfig } from '../../lib/k8s.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import { colorOpt, orgaIdOrNameOpt, updateNotifierOpt, verboseOpt } from '../global.opts.js';
import { k8sIdOrNameArg } from './k8s.args.js';

export const k8sGetKubeconfigCommand = defineCommand({
  name: 'get-kubeconfig',
  description: 'Get configuration of a Kubernetes cluster',
  experimental: false,
  featureFlag: null,
  opts: {
    color: colorOpt,
    'update-notifier': updateNotifierOpt,
    verbose: verboseOpt,
    org: orgaIdOrNameOpt,
  },
  args: [k8sIdOrNameArg],
  async execute(params) {
    const [clusterIdOrName] = params.args;
    const orgIdOrName = params.options.org;

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
