'use strict';

const _ = require('lodash');

const AppConfig = require('../models/app_configuration.js');
const Deployment = require('../models/deployment.js');
const handleCommandStream = require('../command-stream-handler');
const Logger = require('../logger.js');

function cancelDeployment (api, params) {
  const { alias } = params.options;

  const s_cancel = AppConfig.getAppData(alias)
    .flatMapLatest(({ app_id, org_id }) => {
      return Deployment.last(api, app_id, org_id).flatMapLatest((deployments) => {
        return Deployment.cancel(api, _.head(deployments) || {}, app_id, org_id);
      });
    })
    .map(() => Logger.println('Deployment cancelled!'));

  handleCommandStream(s_cancel);
};

module.exports = cancelDeployment;
