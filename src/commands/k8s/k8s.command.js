import { colorOpt, updateNotifierOpt, verboseOpt } from '../global.opts.js';

export const k8sCommand = {
  name: 'k8s',
  description: 'Manage Kubernetes clusters',
  experimental: true,
  featureFlag: 'k8s',
  opts: {
    color: colorOpt,
    'update-notifier': updateNotifierOpt,
    verbose: verboseOpt,
  },
  args: [],
  execute: null,
};
