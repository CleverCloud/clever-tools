import { defineCommand } from '../../lib/define-command.js';
import { k8sUpdateVersion } from '../../lib/k8s.js';
import { orgaIdOrNameOption, targetVersionOption } from '../global.options.js';
import { k8sIdOrNameArg } from './k8s.args.js';

export const k8sVersionUpdateCommand = defineCommand({
  description: 'Update a Kubernetes cluster to a target version',
  since: '4.9.0',
  options: {
    org: orgaIdOrNameOption,
    target: targetVersionOption,
  },
  args: [k8sIdOrNameArg],
  async handler(options, clusterIdOrName) {
    const { target, org: orgIdOrName } = options;
    await k8sUpdateVersion(orgIdOrName, clusterIdOrName, target);
  },
});
