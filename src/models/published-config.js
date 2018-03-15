'use strict';

const _ = require('lodash');

function list (api, appId, orgaId) {
  const params = orgaId ? [orgaId, appId] : [appId];
  return api.owner(orgaId).applications._.exposed_env.get().withParams(params).send();
};

function set (api, name, value, appId, orgaId) {
  return list(api, appId, orgaId).flatMapLatest((values) => {
    const pairs = _.assign({}, values, { [name]: value });
    return bulkSet(api, pairs, appId, orgaId);
  });
};

function remove (api, name, appId, orgaId) {
  return list(api, appId, orgaId).flatMapLatest((values) => {
    const pairs = _.omit(values, name);
    return bulkSet(api, pairs, appId, orgaId);
  });
};

function bulkSet (api, vars, appId, orgaId) {
  const params = orgaId ? [orgaId, appId] : [appId];
  const payload = JSON.stringify(vars);
  return api.owner(orgaId).applications._.exposed_env.put().withParams(params).send(payload);
};

module.exports = { list, set, remove, bulkSet };
