import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import * as networkGroup from '../../models/ng.js';
import { humanJsonOutputFormatFlag, orgaIdOrNameFlag } from '../global.flags.js';
import { ngExternalIdOrLabelArg, ngIdOrLabelArg } from './ng.args.js';

export const ngGetConfigCommand = defineCommand({
  description: 'Get the WireGuard configuration of a peer in a Network Group',
  flags: {
    org: orgaIdOrNameFlag,
    format: humanJsonOutputFormatFlag,
  },
  args: [ngExternalIdOrLabelArg, ngIdOrLabelArg],
  async handler(flags, peerIdOrLabel, ngIdOrLabel) {
    const { org, format } = flags;

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
