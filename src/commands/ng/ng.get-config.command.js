import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import * as networkGroup from '../../models/ng.js';
import { orgaIdOrNameOption } from '../global.options.js';
import { ngExternalIdOrLabelArg, ngIdOrLabelArg } from './ng.args.js';

export const ngGetConfigCommand = defineCommand({
  description: 'Get the WireGuard configuration of a peer in a Network Group',
  since: '3.12.0',
  options: {
    org: orgaIdOrNameOption,
  },
  args: [ngExternalIdOrLabelArg, ngIdOrLabelArg],
  async handler(options, peerIdOrLabel, ngIdOrLabel) {
    const { org } = options;

    const peerConfig = await networkGroup.getPeerConfig(peerIdOrLabel, ngIdOrLabel, org);

    Logger.println(peerConfig);
  },
});
