'use strict';

const application = require('@clevercloud/client/cjs/api/v2/application.js');
const AppConfig = require('../models/app_configuration.js');
const Organisation = require('../models/organisation.js');
const Logger = require('../logger.js');

const { sendToApi } = require('../models/send-to-api.js');
const { upperCase } = require('lodash');

async function listNamespaces (params) {
  const { format } = params.options;
  const namespaces = await Organisation.getNamespaces(params);
  namespaces.sort((a, b) => a.namespace.localeCompare(b.namespace));

  switch (format) {
    case 'json': {
      Logger.println(JSON.stringify(namespaces, null, 2));
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
};

async function list (params) {
  const { alias, format } = params.options;
  const { ownerId, appId } = await AppConfig.getAppDetails({ alias });

  const tcpRedirs = await application.getTcpRedirs({ id: ownerId, appId }).then(sendToApi);
  // const udpRedirs = await application.getUdpRedirs({ id: ownerId, appId }).then(sendToApi);
  const udpRedirs = [];

  if (tcpRedirs.length === 0 && udpRedirs.length === 0) {
    Logger.println('No ports opened through TCP/UDP redirections for this application');
    return;
  }

  switch (format) {
    case 'json': {
      Logger.println(JSON.stringify({ tcp: tcpRedirs, udp: udpRedirs }, null, 2));
      break;
    }
    case 'human':
    default: {
      if (tcpRedirs.length > 0) {
        Logger.println('TCP redirections:');
        for (const { namespace, port } of tcpRedirs) {
          Logger.println(`- ${port} (${namespace})`);
        }
      }

      if (udpRedirs.length > 0) {
        Logger.println('UDP redirections:');
        for (const { namespace, port } of udpRedirs) {
          Logger.println(`- ${port} (${namespace})`);
        }
      }
      break;
    }
  }
}

async function add (params) {
  const { alias } = params.options;
  const { ownerId, appId } = await AppConfig.getAppDetails({ alias });
  const [namespace, type] = params.args;

  let result = null;
  if (type === 'tcp') {
    result = await application.addTcpRedir({ id: ownerId, appId }, { namespace }).then(sendToApi);
  }
  else {
    result = await application.addUdpRedir({ id: ownerId, appId }, { namespace }).then(sendToApi);
  }

  Logger.println(`Successfully added a ${upperCase(type)} redirection in namespace ${namespace}`);
  Logger.println(`After a restart, external port ${result.port} will redirect to port 4040 of your app`);
};

async function remove (params) {
  const [port, namespace, type] = params.args;

  const { alias } = params.options;
  const { ownerId, appId } = await AppConfig.getAppDetails({ alias });

  switch (type) {
    case 'tcp': {
      await application.removeTcpRedir({ id: ownerId, appId, sourcePort: port, namespace }).then(sendToApi);
      break;
    }
    case 'udp':
    default: {
      await application.removeUdpRedir({ id: ownerId, appId, sourcePort: port, namespace }).then(sendToApi);
      break;
    }
  }
  Logger.println(`Successfully removed the ${upperCase(type)} redirection on port ${port}, restart your app`);
};

module.exports = { listNamespaces, list, add, remove };
