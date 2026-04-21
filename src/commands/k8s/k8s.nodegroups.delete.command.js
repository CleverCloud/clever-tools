import { defineCommand } from '../../lib/define-command.js';
import { k8sDeleteNodeGroup } from '../../lib/k8s.js';
import { ask } from '../../lib/prompts.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import { orgaIdOrNameOption, skipConfirmationOption } from '../global.options.js';
import { k8sIdOrNameArg, k8sNodeGroupIdOrNameArg } from './k8s.args.js';

export const k8sNodeGroupDeleteCommand = defineCommand({
  description: 'Delete a node group from a Kubernetes cluster',
  since: '4.9.0',
  options: {
    org: orgaIdOrNameOption,
    yes: skipConfirmationOption,
  },
  args: [k8sIdOrNameArg, k8sNodeGroupIdOrNameArg],
  async handler(options, clusterIdOrName, nodeGroupIdOrName) {
    const { org: orgIdOrName, yes } = options;

    if (!yes) {
      const proceed = await ask(
        `Are you sure you want to delete the node group ${styleText('blue', nodeGroupIdOrName)}?`,
        false,
      );
      if (!proceed) {
        Logger.println('Node group deletion cancelled');
        return;
      }
    }

    await k8sDeleteNodeGroup(orgIdOrName, clusterIdOrName, nodeGroupIdOrName);
    Logger.printSuccess(`Node group ${styleText('green', nodeGroupIdOrName)} successfully deleted`);
  },
});
