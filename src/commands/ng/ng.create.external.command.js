import { z } from 'zod';
import { defineArgument } from '../../lib/define-argument.js';
import { defineCommand } from '../../lib/define-command.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import * as networkGroupResources from '../../models/ng-resources.js';
import { ngResourceType } from '../../parsers.js';
import { orgaIdOrNameOption } from '../global.options.js';
import { ngIdOrLabelArg } from './ng.args.js';

export const ngCreateExternalCommand = defineCommand({
  description: 'Create an external peer in a Network Group',
  since: '3.12.0',
  options: {
    org: orgaIdOrNameOption,
  },
  args: [
    defineArgument({
      schema: z.string().transform(ngResourceType),
      description: 'External peer label',
      placeholder: 'external-peer-label',
    }),
    ngIdOrLabelArg,
    defineArgument({
      schema: z.string(),
      description: 'WireGuard public key of the external peer to link to a Network Group',
      placeholder: 'public-key',
    }),
  ],
  async handler(options, peerIdOrLabel, ngIdOrLabel, publicKey) {
    const { org } = options;

    await networkGroupResources.createExternalPeerWithParent(
      ngIdOrLabel,
      peerIdOrLabel.ngResourceLabel,
      publicKey,
      org,
    );
    const ngText = ngIdOrLabel.ngResourceLabel ?? ngIdOrLabel.ngId;
    Logger.printSuccess(
      `External peer ${styleText('green', peerIdOrLabel.ngResourceLabel)} successfully created in Network Group ${styleText('green', ngText)}`,
    );
  },
});
