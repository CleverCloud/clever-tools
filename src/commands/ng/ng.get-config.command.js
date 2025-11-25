import { Logger } from '../../logger.js';
import * as networkGroup from '../../models/ng.js';
import { colorOpt, humanJsonOutputFormatOpt, orgaIdOrNameOpt, updateNotifierOpt, verboseOpt } from '../global.opts.js';
import { ngExternalIdOrLabelArg, ngIdOrLabelArg } from './ng.args.js';

export const ngGetConfigCommand = {
  name: 'get-config',
  description: 'Get the WireGuard configuration of a peer in a Network Group',
  experimental: false,
  featureFlag: null,
  opts: {
    color: colorOpt,
    'update-notifier': updateNotifierOpt,
    verbose: verboseOpt,
    org: orgaIdOrNameOpt,
    format: humanJsonOutputFormatOpt,
  },
  args: [ngExternalIdOrLabelArg, ngIdOrLabelArg],
  async execute(params) {
    const [peerIdOrLabel, ngIdOrLabel] = params.args;
    const { org, format } = params.options;

    const config = await networkGroup.getPeerConfig(peerIdOrLabel, ngIdOrLabel, org);

    switch (format) {
      case 'json': {
        Logger.printJson(config);
        break;
      }
      case 'human':
      default: {
        const decodedConfiguration = Buffer.from(config.configuration, 'base64').toString('utf8');
        Logger.println(decodedConfiguration);
      }
    }
  },
};
