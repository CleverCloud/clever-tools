import { fqdnArg } from './domain.args.js';
import { colorOpt, updateNotifierOpt, verboseOpt, aliasOpt, appIdOrNameOpt } from '../global.opts.js';
import {
  addDomain,
  getAllDomains,
  get as getApp,
  markFavouriteDomain,
  removeDomain,
  unmarkFavouriteDomain,
} from '@clevercloud/client/esm/api/v2/application.js';
import { getSummary } from '@clevercloud/client/esm/api/v2/user.js';
import { getDefaultLoadBalancersDnsInfo } from '@clevercloud/client/esm/api/v4/load-balancers.js';
import { diagDomainConfig } from '@clevercloud/client/esm/utils/diag-domain-config.js';
import { sortDomains } from '@clevercloud/client/esm/utils/domains.js';
import _ from 'lodash';
import { parse as parseDomain } from 'tldts';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import * as Application from '../../models/application.js';
import { DnsResolver } from '../../models/node-dns-resolver.js';
import { sendToApi } from '../../models/send-to-api.js';
import { getDomainObject, getFavouriteDomain } from '../../models/domain.js';

export const domainAddCommand = {
  name: 'add',
  description: 'Add a domain name to an application',
  experimental: false,
  featureFlag: null,
  opts: {
    color: colorOpt,
    'update-notifier': updateNotifierOpt,
    verbose: verboseOpt,
    alias: aliasOpt,
    app: appIdOrNameOpt
  },
  args: [
    fqdnArg,
  ],
  async execute(params) {
    const [fqdn] = params.args;
      const { alias, app: appIdOrName } = params.options;
      const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);
      const encodedFqdn = encodeURIComponent(fqdn);
    
      await addDomain({ id: ownerId, appId, domain: encodedFqdn }).then(sendToApi);
      Logger.println('Your domain has been successfully saved');
  }
};
