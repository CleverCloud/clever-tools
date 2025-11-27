import { defineCommand } from '../../lib/define-command.js';
import { k8sDelete } from '../../lib/k8s.js';
import { confirm } from '../../lib/prompts.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import { confirmAddonDeletionFlag, orgaIdOrNameFlag } from '../global.flags.js';
import { k8sIdOrNameArg } from './k8s.args.js';

export const k8sDeleteCommand = defineCommand({
  description: 'Delete a Kubernetes cluster',
  flags: {
    org: orgaIdOrNameFlag,
    yes: confirmAddonDeletionFlag,
  },
  args: [k8sIdOrNameArg],
  async handler(flags, clusterIdOrName) {
    const { org: orgIdOrName, yes: confirmDeletion } = flags;

    let proceedDeletion;
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
});
