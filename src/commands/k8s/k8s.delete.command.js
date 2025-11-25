import { k8sDelete } from '../../lib/k8s.js';
import { confirm } from '../../lib/prompts.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import { colorOpt, confirmAddonDeletionOpt, orgaIdOrNameOpt, updateNotifierOpt, verboseOpt } from '../global.opts.js';
import { k8sIdOrNameArg } from './k8s.args.js';

export const k8sDeleteCommand = {
  name: 'delete',
  description: 'Delete a Kubernetes cluster',
  experimental: false,
  featureFlag: null,
  opts: {
    color: colorOpt,
    'update-notifier': updateNotifierOpt,
    verbose: verboseOpt,
    org: orgaIdOrNameOpt,
    yes: confirmAddonDeletionOpt,
  },
  args: [k8sIdOrNameArg],
  async execute(params) {
    const [clusterIdOrName] = params.args;
    const { org: orgIdOrName, yes: confirmDeletion } = params.options;

    let proceedDeletion = false;
    if (confirmDeletion) {
      proceedDeletion = true;
    } else {
      proceedDeletion = await confirm(
        `Are you sure you want to delete the Kubernetes cluster ${styleText(
          'blue',
          clusterIdOrName.addon_name || clusterIdOrName.operator_id,
        )}?`,
        'Kubernetes cluster deletion cancelled.',
      );
    }

    if (proceedDeletion) {
      await k8sDelete(orgIdOrName, clusterIdOrName);
      Logger.printSuccess(
        `Kubernetes cluster ${styleText('green', clusterIdOrName.addon_name || clusterIdOrName.operator_id)} successfully deleted`,
      );
    }
  },
};
