'use strict';

const colors = require('colors/safe');

const AppConfig = require('../models/app_configuration.js');
const Organisation = require('../models/organisation.js');
const { sendToApi } = require('../models/send-to-api.js');
const Interact = require('../models/interact.js');
const Logger = require('../logger.js');
const application = require('@clevercloud/client/cjs/api/v2/application.js');

async function listNamespaces (params) {
  const namespaces = await Organisation.getNamespaces(params);

  Logger.println('Available namespaces: ' + namespaces.map(({ namespace }) => namespace).join(', '));
};

async function list (params) {
  const { alias } = params.options;
  const { ownerId, appId } = await AppConfig.getAppDetails({ alias });

  const redirs = await application.getTcpRedirs({ id: ownerId, appId }).then(sendToApi);

  if (redirs.length === 0) {
    Logger.println('No active TCP redirection for this application');
  }
  else {
    Logger.println('Enabled TCP redirections:');
    for (const { namespace, port } of redirs) {
      Logger.println(port + ' on ' + namespace);
    }
  }
}

async function acceptPayment (result, skipConfirmation) {
  if (!skipConfirmation) {
    result.lines.forEach(({ description, VAT, price }) => Logger.println(`${description}\tVAT: ${VAT}%\tPrice: ${price}€`));
    Logger.println(`Total (without taxes): ${result.totalHT}€`);
    Logger.println(colors.bold(`Total (with taxes): ${result.totalTTC}€`));

    await Interact.confirm(
      `You're about to pay ${result.totalTTC}€, confirm? (yes or no) `,
      'No confirmation, aborting TCP redirection creation',
    );
  }
}

async function add (params) {
  const { alias, namespace, yes: skipConfirmation } = params.options;
  const { ownerId, appId } = await AppConfig.getAppDetails({ alias });

  const { port } = await application.addTcpRedir({ id: ownerId, appId }, { namespace }).then(sendToApi).catch((error) => {
    if (error.status === 402) {
      return acceptPayment(error.response.body, skipConfirmation).then(() => {
        return application.addTcpRedir({ id: ownerId, appId, payment: 'accepted' }, { namespace }).then(sendToApi);
      });
    }
    else {
      throw error;
    }
  });

  Logger.println('Successfully added tcp redirection on port: ' + port);
};

async function remove (params) {
  const [port] = params.args;
  const { alias, namespace } = params.options;
  const { ownerId, appId } = await AppConfig.getAppDetails({ alias });

  await application.removeTcpRedir({ id: ownerId, appId, sourcePort: port, namespace }).then(sendToApi);

  Logger.println('Successfully removed tcp redirection.');
};

module.exports = { listNamespaces, list, add, remove };
