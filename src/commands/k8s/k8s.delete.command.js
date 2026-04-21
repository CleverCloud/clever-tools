import { defineCommand } from '../../lib/define-command.js';
import { k8sDelete } from '../../lib/k8s.js';
import { ask } from '../../lib/prompts.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import { orgaIdOrNameOption, skipConfirmationOption } from '../global.options.js';
import { k8sIdOrNameArg } from './k8s.args.js';

export const k8sDeleteCommand = defineCommand({
  description: 'Delete a Kubernetes cluster',
  since: '4.3.0',
  options: {
    org: orgaIdOrNameOption,
    yes: skipConfirmationOption,
  },
  args: [k8sIdOrNameArg],
  async handler(options, clusterIdOrName) {
    const { org: orgIdOrName, yes } = options;
    const display = clusterIdOrName.addon_name || clusterIdOrName.operator_id;

    if (!yes) {
      const proceed = await ask(
        `Are you sure you want to delete the Kubernetes cluster ${styleText('blue', display)}?`,
        false,
      );
      if (!proceed) {
        Logger.println('Kubernetes cluster deletion cancelled');
        return;
      }
    }

    await k8sDelete(orgIdOrName, clusterIdOrName);
    Logger.printSuccess(`Kubernetes cluster ${styleText('green', display)} successfully deleted`);
  },
});
