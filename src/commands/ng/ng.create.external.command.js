import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import * as networkGroupResources from '../../models/ng-resources.js';
import { ngResourceType as ngResourceTypeParser } from '../../parsers.js';
import { colorOpt, orgaIdOrNameOpt, updateNotifierOpt, verboseOpt } from '../global.opts.js';
import { ngIdOrLabelArg } from './ng.args.js';

export const ngCreateExternalCommand = {
  name: 'external',
  description: 'Create an external peer in a Network Group',
  experimental: false,
  featureFlag: null,
  opts: {
    color: colorOpt,
    'update-notifier': updateNotifierOpt,
    verbose: verboseOpt,
    org: orgaIdOrNameOpt,
  },
  args: [
    {
      name: 'external-peer-label',
      description: 'External peer label',
      parser: ngResourceTypeParser,
      complete: null,
    },
    {
      name: 'public-key',
      description: 'WireGuard public key of the external peer to link to a Network Group',
      parser: null,
      complete: null,
    },
    ngIdOrLabelArg,
  ],
  async execute(params) {
    const [peerIdOrLabel, ngIdOrLabel, publicKey] = params.args;
    const { org } = params.options;

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
};
