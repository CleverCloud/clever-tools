import { spawn } from 'node:child_process';
import { conf, loadOAuthConf } from '../models/configuration.js';
import { addOauthHeader } from '@clevercloud/client/esm/oauth.js';
import { Logger } from '../logger.js';
import { styleText } from 'node:util';
import dedent from 'dedent';

async function loadTokens () {
  const tokens = await loadOAuthConf();
  return {
    OAUTH_CONSUMER_KEY: conf.OAUTH_CONSUMER_KEY,
    OAUTH_CONSUMER_SECRET: conf.OAUTH_CONSUMER_SECRET,
    API_OAUTH_TOKEN: tokens.token,
    API_OAUTH_TOKEN_SECRET: tokens.secret,
  };
}

function printCleverCurlHelp () {
  Logger.println(dedent`
    Usage: clever curl
    Query Clever Cloud's API using Clever Tools credentials. For example:
    
      clever curl ${conf.API_HOST}/v2/self
      clever curl ${conf.API_HOST}/v2/summary
      clever curl ${conf.API_HOST}/v4/products/zones
      clever curl ${conf.API_HOST}/v2/organisations/<ORGANISATION_ID>/applications | jq '.[].id'
      clever curl ${conf.API_HOST}/v4/billing/organisations/<ORGANISATION_ID>/<INVOICE_NUMBER>.pdf > invoice.pdf
    
    Our API documentation is available here :
    
      ${conf.API_DOC_URL}/v2/
      ${conf.API_DOC_URL}/v4/
  `);
}

export async function curl () {

  // We remove the first three args: "node", "clever" and "curl"
  const curlArgs = process.argv.slice(2);
  const hasNoArgs = curlArgs.length === 0;
  const startsWithHelpArg = curlArgs[0] === '--help' || curlArgs[0] === '-h';
  const shouldDisplayCleverCurlHelp = hasNoArgs || startsWithHelpArg;

  if (shouldDisplayCleverCurlHelp) {
    printCleverCurlHelp();
    return;
  }

  const curlUrl = curlArgs.find((part) => part.startsWith(conf.API_HOST));

  // We only allow request to the respective API_HOST
  if (curlUrl == null) {
    Logger.error('"clever curl" command must be used with ' + styleText('blue', conf.API_HOST));
    process.exit(1);
  }

  const lastCurlArg = curlArgs.at(-1);
  const lastCurlArgIsHelp = lastCurlArg !== '--help' && lastCurlArg !== '-h';

  // Add OAuth header, only if last cURL arg is not help
  // We do this because cURL's help arg expect a category
  if (lastCurlArgIsHelp) {

    const tokens = await loadTokens();
    const oauthHeader = await Promise.resolve({})
      .then(addOauthHeader(tokens))
      .then((request) => request.headers.authorization);

    curlArgs.push('-H', `authorization: ${oauthHeader}`);
  }

  spawn('curl', curlArgs, { stdio: 'inherit' });
}
