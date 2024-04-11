'use strict';

const { spawn } = require('child_process');
const { loadOAuthConf, conf } = require('../models/configuration.js');
const { addOauthHeader } = require('@clevercloud/client/cjs/oauth.js');
const Logger = require('../logger.js');
const colors = require('colors/safe');
const curlParser = require('../../vendors/curlconverter-parse.js');

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
  const apiDocUrlv2 = 'https://developers.clever-cloud.com/api/v2/';
  const apiDocUrlv4 = 'https://developers.clever-cloud.com/api/v4/';

  Logger.println(`Usage: clever curl
Query Clever Cloud's API using Clever Tools credentials. For example: 

  clever curl ${conf.API_HOST}/v2/self
  clever curl ${conf.API_HOST}/v2/summary
  clever curl ${conf.API_HOST}/v4/products/zones
  clever curl ${conf.API_HOST}/v2/organisations/<ORGANISATION_ID>/applications | jq '.[].id'
  clever curl ${conf.API_HOST}/v4/billing/organisations/<ORGANISATION_ID>/<INVOICE_NUMBER>.pdf > invoice.pdf

Our API documentation is available here : 

  ${apiDocUrlv2}
  ${apiDocUrlv4}`);
}

async function curl () {

  // We remove the first three args: "node", "clever" and "curl"
  const curlArgs = process.argv.slice(3);
  const hasNoArgs = curlArgs.length === 0;
  const startsWithHelpArg = curlArgs[0] === '--help' || curlArgs[0] === '-h';
  const shouldDisplayCleverCurlHelp = hasNoArgs || startsWithHelpArg;

  if (shouldDisplayCleverCurlHelp) {
    printCleverCurlHelp();
    return;
  }

  const requestParams = await parseCurlCommand(['curl', ...curlArgs]);

  // We only allow request to the respective API_HOST
  if (!requestParams.url.startsWith(conf.API_HOST)) {
    Logger.error('"clever curl" command must be used with ' + colors.blue(conf.API_HOST));
    process.exit(1);
  }

  const lastCurlArg = curlArgs.at(-1);
  const lastCurlArgIsHelp = lastCurlArg !== '--help' && lastCurlArg !== '-h';

  // Add oAuth header, only if last cURL arg is not help
  // We do this because cURL's help arg expect a category
  if (lastCurlArgIsHelp) {

    const tokens = await loadTokens();
    const oauthHeader = await Promise.resolve(requestParams)
      .then(addOauthHeader(tokens))
      .then((request) => request.headers.Authorization);

    curlArgs.push('-H', `Authorization: ${oauthHeader}`);
  }

  spawn('curl', curlArgs, { stdio: 'inherit' });

}

async function parseCurlCommand (curlCommand) {

  const [request] = curlParser.parse(curlCommand);
  const url = request.urls[0];

  return {
    method: url.method.toString(),
    url: url.urlWithoutQueryArray.toString(),
    headers: transformCurlConverterWordsToObject(request.headers.headers),
    queryParams: transformCurlConverterWordsToObject(url.queryDict),
  };
}

function transformCurlConverterWordsToObject (words = []) {
  return Object.fromEntries(
    words.map(([key, value]) => {
      return [key.toString(), value.toString()];
    }),
  );
}

module.exports = { curl };
