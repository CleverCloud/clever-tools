'use strict';

const { parseCurlCommand } = require('curlconverter/util.js');
const { spawn } = require('child_process');
const { loadOAuthConf, conf } = require('../models/configuration.js');
const { addOauthHeader } = require('@clevercloud/client/cjs/oauth.js');
const { println } = require('../logger.js');

async function loadTokens () {
  const tokens = await loadOAuthConf();
  return {
    OAUTH_CONSUMER_KEY: conf.OAUTH_CONSUMER_KEY,
    OAUTH_CONSUMER_SECRET: conf.OAUTH_CONSUMER_SECRET,
    API_OAUTH_TOKEN: tokens.token,
    API_OAUTH_TOKEN_SECRET: tokens.secret,
  };
}

function printHelp () {
  const apiDocUrlv2 = 'https://developers.clever-cloud.com/api/v2/';
  const apiDocUrlv4 = 'https://developers.clever-cloud.com/api/v4/';

  println(`Usage: clever curl
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

  const curlNeedsHelp = process.argv[2] !== 'curl' || process.argv.length < 3 || process.argv[3] === '--help' || process.argv[3] === '-h';

  if (curlNeedsHelp) {
    printHelp();
    return;
  }

  // We have to add single quotes on values for the parser
  const curlString = process.argv
    .slice(2)
    .map((str) => !str.startsWith('-') ? `'${str}'` : str)
    .join(' ');

  if (!curlString.includes(conf.API_HOST)) {
    printHelp();
    return;
  }

  const curlDetails = parseCurlCommand(curlString);
  const tokens = await loadTokens();

  const requestParams = {
    method: curlDetails.method,
    url: curlDetails.urlWithoutQuery,
    headers: curlDetails.headers,
    queryParams: curlDetails.query,
  };

  const oauthHeader = await Promise.resolve(requestParams)
    .then(addOauthHeader(tokens))
    .then((request) => request.headers.Authorization);

  // Reuse raw curl command
  const curlParams = process.argv.slice(3);

  // Add oauth
  curlParams.push('-H', `Authorization: ${oauthHeader}`);

  spawn('curl', curlParams, { stdio: 'inherit' });

}

module.exports = { curl };
