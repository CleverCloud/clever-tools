"use strict";

const AppConfig = require("../models/app_configuration.js");
const Logger = require("../logger.js");
const {
  get: getApp,
  addDomain,
  getFavouriteDomain,
  markFavouriteDomain,
  unmarkFavouriteDomain,
  removeDomain,
} = require("@clevercloud/client/cjs/api/application.js");
const { sendToApi } = require("../models/send-to-api.js");

async function list(params) {
  const { alias } = params.options;
  const { ownerId, appId } = await AppConfig.getAppDetails({ alias });

  const app = await getApp({ id: ownerId, appId }).then(sendToApi);
  return app.vhosts.forEach(({ fqdn }) => Logger.println(fqdn));
}

async function add(params) {
  const [fqdn] = params.args;
  const { alias } = params.options;
  const { ownerId, appId } = await AppConfig.getAppDetails({ alias });
  const encodedFqdn = encodeURIComponent(fqdn);

  await addDomain({ id: ownerId, appId, domain: encodedFqdn }).then(sendToApi);
  Logger.println("Your domain has been successfully saved");
}

async function getFavourite(params) {
  const { alias } = params.options;
  const { ownerId, appId } = await AppConfig.getAppDetails({ alias });

  const { fqdn } = await getFavouriteDomain({ id: ownerId, appId })
    .then(sendToApi)
    .catch((error) => {
      if (error.id === 4021) {
        // No favourite vhost
        return { fqdn: null };
      } else {
        throw error;
      }
    });
  if (fqdn != null) {
    return Logger.println(fqdn);
  } else {
    return Logger.println("No favourite domain set");
  }
}

async function setFavourite(params) {
  const [fqdn] = params.args;
  const { alias } = params.options;
  const { ownerId, appId } = await AppConfig.getAppDetails({ alias });
  const encodedFqdn = encodeURIComponent(fqdn);

  await markFavouriteDomain({ id: ownerId, appId, domain: encodedFqdn }).then(
    sendToApi
  );
  Logger.println("Your favourite domain has been successfully set");
}

async function unsetFavourite(params) {
  const [fqdn] = params.args;
  const { alias } = params.options;
  const { ownerId, appId } = await AppConfig.getAppDetails({ alias });
  const encodedFqdn = encodeURIComponent(fqdn);

  await unmarkFavouriteDomain({ id: ownerId, appId, domain: encodedFqdn }).then(
    sendToApi
  );
  Logger.println("Your favourite domain has been successfully unset");
}

async function rm(params) {
  const [fqdn] = params.args;
  const { alias } = params.options;
  const { ownerId, appId } = await AppConfig.getAppDetails({ alias });
  const encodedFqdn = encodeURIComponent(fqdn);

  await removeDomain({ id: ownerId, appId, domain: encodedFqdn }).then(
    sendToApi
  );
  Logger.println("Your domain has been successfully removed");
}

module.exports = { list, add, getFavourite, setFavourite, unsetFavourite, rm };
