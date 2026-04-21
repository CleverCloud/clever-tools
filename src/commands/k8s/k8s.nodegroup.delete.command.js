import { defineCommand } from '../../lib/define-command.js';
import { k8sDeleteNodeGroup } from '../../lib/k8s.js';
import { confirm } from '../../lib/prompts.js';
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
      await confirm(
        `Are you sure you want to delete the node group ${styleText('blue', nodeGroupIdOrName)}?`,
        'Node group deletion cancelled',
      );
    }

    await k8sDeleteNodeGroup(orgIdOrName, clusterIdOrName, nodeGroupIdOrName);
    Logger.printSuccess(`Node group ${styleText('green', nodeGroupIdOrName)} successfully deleted`);
  },
});
