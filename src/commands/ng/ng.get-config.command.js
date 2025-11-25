import { ngExternalIdOrLabelArg, ngIdOrLabelArg } from './ng.args.js';
import { colorOpt, updateNotifierOpt, verboseOpt, orgaIdOrNameOpt, humanJsonOutputFormatOpt } from '../global.opts.js';
import { printResults } from '../../lib/ng-print.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import * as networkGroupResources from '../../models/ng-resources.js';
import * as networkGroup from '../../models/ng.js';

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
    format: humanJsonOutputFormatOpt
  },
  args: [
    ngExternalIdOrLabelArg,
    ngIdOrLabelArg,
  ],
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
  }
};
