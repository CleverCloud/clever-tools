import { addOauthHeader } from '@clevercloud/client/esm/oauth.js';
import dedent from 'dedent';
import { spawn } from 'node:child_process';
import { config } from '../../config/config.js';
import { defineCommand } from '../../lib/define-command.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';

function getTokens() {
  return {
    OAUTH_CONSUMER_KEY: config.OAUTH_CONSUMER_KEY,
    OAUTH_CONSUMER_SECRET: config.OAUTH_CONSUMER_SECRET,
    API_OAUTH_TOKEN: config.token,
    API_OAUTH_TOKEN_SECRET: config.secret,
  };
}

function printCleverCurlHelp() {
  Logger.println(dedent`
    Usage: clever curl
    Query Clever Cloud's API using Clever Tools credentials. For example:
    
      clever curl ${config.API_HOST}/v2/self
      clever curl ${config.API_HOST}/v2/summary
      clever curl ${config.API_HOST}/v4/products/zones
      clever curl ${config.API_HOST}/v2/organisations/<ORGANISATION_ID>/applications | jq '.[].id'
      clever curl ${config.API_HOST}/v4/billing/organisations/<ORGANISATION_ID>/<INVOICE_NUMBER>.pdf > invoice.pdf
    
    Our API documentation is available here :
    
      ${config.API_DOC_URL}/v2/
      ${config.API_DOC_URL}/v4/
  `);
}

export async function curl() {
  // We remove the first three args: "node", "clever" and "curl"
  const curlArgs = process.argv.slice(3);
  const hasNoArgs = curlArgs.length === 0;
  const startsWithHelpArg = curlArgs[0] === '--help' || curlArgs[0] === '-h';
  const shouldDisplayCleverCurlHelp = hasNoArgs || startsWithHelpArg;

  if (shouldDisplayCleverCurlHelp) {
    printCleverCurlHelp();
    return;
  }

  const curlUrl = curlArgs.find((part) => part.startsWith(config.API_HOST));

  // We only allow request to the respective API_HOST
  if (curlUrl == null) {
    Logger.error('"clever curl" command must be used with ' + styleText('blue', config.API_HOST));
    process.exit(1);
  }

  const lastCurlArg = curlArgs.at(-1);
  const lastCurlArgIsHelp = lastCurlArg !== '--help' && lastCurlArg !== '-h';

  // Add OAuth header, only if last cURL arg is not help
  // We do this because cURL's help arg expect a category
  if (lastCurlArgIsHelp) {
    const tokens = getTokens();
    const oauthHeader = await Promise.resolve({})
      .then(addOauthHeader(tokens))
      .then((request) => request.headers.authorization);

    curlArgs.push('-H', `authorization: ${oauthHeader}`);
  }

  spawn('curl', curlArgs, { stdio: 'inherit' });
}

export const curlCommand = defineCommand({
  description: "Query Clever Cloud's API using Clever Tools credentials",
  since: '2.10.0',
  handler: null,
});
