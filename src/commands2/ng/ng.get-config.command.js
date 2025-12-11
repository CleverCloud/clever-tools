import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import * as networkGroup from '../../models/ng.js';
import { humanJsonOutputFormatOption, orgaIdOrNameOption } from '../global.options.js';
import { ngExternalIdOrLabelArg, ngIdOrLabelArg } from './ng.args.js';

export const ngGetConfigCommand = defineCommand({
  description: 'Get the WireGuard configuration of a peer in a Network Group',
  since: '3.12.0',
  sinceDate: '2025-03-06',
  options: {
    org: orgaIdOrNameOption,
    format: humanJsonOutputFormatOption,
  },
  args: [ngExternalIdOrLabelArg, ngIdOrLabelArg],
  async handler(options, peerIdOrLabel, ngIdOrLabel) {
    const { org, format } = options;

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
});
