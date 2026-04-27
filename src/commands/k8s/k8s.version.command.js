import { defineCommand } from '../../lib/define-command.js';
import { k8sCheckVersion } from '../../lib/k8s.js';
import { humanJsonOutputFormatOption, orgaIdOrNameOption } from '../global.options.js';
import { k8sIdOrNameArg } from './k8s.args.js';

export const k8sVersionCommand = defineCommand({
  description: 'Check a Kubernetes cluster deployed version',
  since: 'unreleased',
  options: {
    org: orgaIdOrNameOption,
    format: humanJsonOutputFormatOption,
  },
  args: [k8sIdOrNameArg],
  async handler(options, clusterIdOrName) {
    const { format, org: orgIdOrName } = options;
    await k8sCheckVersion(orgIdOrName, clusterIdOrName, format);
  },
});
