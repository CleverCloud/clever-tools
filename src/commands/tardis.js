'use strict';
const Logger = require('../logger.js');
const pkg = require('../../package.json');
const { sendToApi } = require('../models/send-to-api.js');
const Organisation = require('../models/organisation.js');
const ApiHelpers = require('../models/api-helpers.js');

async function applications (params) {
  const { org: orgaIdOrName, from: from, to: to } = params.options;
  const ownerId = await Organisation.getId(orgaIdOrName);
  const applications = await ApiHelpers.getWarp10Applications({ id: ownerId }, from, to ).then(sendToApi);
  Logger.println(applications)
}

async function createApplication (params) {
  const { org: orgaIdOrName, ttl: ttl, 'without-tokens': withoutTokens } = params.options;
  const ownerId = await Organisation.getId(orgaIdOrName);
  const app = await ApiHelpers.createWarp10Application({ id: ownerId , ttl: ttl}, withoutTokens).then(sendToApi);
  Logger.println(app)
}

async function deleteApplication (params) {
  const [ warp10Application ] = params.args;
  const { org: orgaIdOrName } = params.options;
  const ownerId = await Organisation.getId(orgaIdOrName);
  const app = await ApiHelpers.deleteWarp10Applications({ id: ownerId , app: warp10Application }).then(sendToApi);
  Logger.println(app)
}

async function applicationInfo (params) {
  const [ warp10Application ] = params.args;
  const { org: orgaIdOrName } = params.options;
  const ownerId = await Organisation.getId(orgaIdOrName);
  const app = await ApiHelpers.getInfoWarp10Application({ id: ownerId, app: warp10Application }).then(sendToApi);
  Logger.println(app)
}

async function applicationTokens (params) {
  const [ warp10Application ] = params.args;
  const { org: orgaIdOrName, details: details, from: from, to: to } = params.options;
  const ownerId = await Organisation.getId(orgaIdOrName);
  const tokens = await ApiHelpers.getAllTokens({ id: ownerId, app: warp10Application }, details, from, to).then(sendToApi);
  Logger.println(tokens)
}

async function getTokenInfo (params) {
  const [ warp10Application, tokenName ] = params.args;
  const { org: orgaIdOrName} = params.options;
  const ownerId = await Organisation.getId(orgaIdOrName);
  const token = await ApiHelpers.getInfoToken({ id: ownerId, app: warp10Application, token: tokenName }).then(sendToApi);
  Logger.println(token)
}

async function createReadToken (params) {
  const [ warp10Application ] = params.args;
  const { org: orgaIdOrName, ttl: tardisTTL, properties: properties, ephemeral: ephemeral, name: name } = params.options;
  const ownerId = await Organisation.getId(orgaIdOrName);
  const token = await ApiHelpers.createAToken({ 
    id: ownerId, 
    app: warp10Application, 
    name: name,
    type: 'READ', 
    ttl: tardisTTL,
    ephemeral: ephemeral, 
    properties: properties 
  }).then(sendToApi);
  Logger.println(token)
}

async function createWriteToken (params) {
  const [ warp10Application ] = params.args;
  const { org: orgaIdOrName, ttl: tardisTTL, properties: properties, ephemeral: ephemeral, name: name } = params.options;
  const ownerId = await Organisation.getId(orgaIdOrName);
  const token = await ApiHelpers.createAToken({ 
    id: ownerId, 
    app: warp10Application, 
    name: name,
    type: 'WRITE', 
    ttl: tardisTTL,
    ephemeral: ephemeral, 
    properties: properties 
   }).then(sendToApi);
  Logger.println(token)
}

module.exports = { 
  applications, 
  createApplication, 
  deleteApplication,
  applicationInfo,
  applicationTokens,
  getTokenInfo,
  createReadToken,
  createWriteToken,
};
