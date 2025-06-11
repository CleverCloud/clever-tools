import { styleText } from 'node:util';

import * as Namespaces from '../models/namespaces.js';
import { sendToApi } from '../models/send-to-api.js';
import { confirm } from '../lib/prompts.js';
import { Logger } from '../logger.js';
import * as Application from '../models/application.js';
import { addTcpRedir, getTcpRedirs, removeTcpRedir } from '@clevercloud/client/esm/api/v2/application.js';

export async function listNamespaces (params) {
  const { alias, app: appIdOrName, format } = params.options;
  const { ownerId } = await Application.resolveId(appIdOrName, alias);

  const namespaces = await Namespaces.getNamespaces(ownerId);

  namespaces.sort((a, b) => a.namespace.localeCompare(b.namespace));

  switch (format) {
    case 'json': {
      Logger.printJson(namespaces);
      break;
    }
    case 'human':
    default: {
      Logger.println('Available namespaces:');
      namespaces.forEach(({ namespace }) => {
        switch (namespace) {
          case 'cleverapps':
            Logger.println(`- ${namespace}: for redirections used with 'cleverapps.io' domain`);
            break;
          case 'default':
            Logger.println(`- ${namespace}: for redirections used with custom domains`);
            break;
          default:
            Logger.println(`- ${namespace}`);
        }
      });
      break;
    }
  }
}

export async function list (params) {
  const { alias, app: appIdOrName, format } = params.options;
  const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

  const redirs = await getTcpRedirs({ id: ownerId, appId }).then(sendToApi);

  switch (format) {
    case 'json': {
      Logger.printJson(redirs);
      break;
    }
    case 'human':
    default: {
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
  }
}

async function acceptPayment (result, skipConfirmation) {
  if (!skipConfirmation) {
    result.lines.forEach(({ description, VAT, price }) => Logger.println(`${description}\tVAT: ${VAT}%\tPrice: ${price}€`));
    Logger.println(`Total (without taxes): ${result.totalHT}€`);
    Logger.println(styleText('bold', `Total (with taxes): ${result.totalTTC}€`));

    await confirm(
      `You're about to pay ${result.totalTTC}€, confirm?`,
      'No confirmation, aborting TCP redirection creation',
    );
  }
}

export async function add (params) {
  const { alias, app: appIdOrName, namespace, yes: skipConfirmation } = params.options;
  const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

  const { port } = await addTcpRedir({ id: ownerId, appId }, { namespace }).then(sendToApi).catch((error) => {
    if (error.status === 402) {
      return acceptPayment(error.response.body, skipConfirmation).then(() => {
        return addTcpRedir({ id: ownerId, appId, payment: 'accepted' }, { namespace }).then(sendToApi);
      });
    }
    else {
      throw error;
    }
  });

  Logger.println('Successfully added tcp redirection on port: ' + port);
};

export async function remove (params) {
  const [port] = params.args;
  const { alias, app: appIdOrName, namespace } = params.options;
  const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

  await removeTcpRedir({ id: ownerId, appId, sourcePort: port, namespace }).then(sendToApi);

  Logger.println('Successfully removed tcp redirection.');
};
