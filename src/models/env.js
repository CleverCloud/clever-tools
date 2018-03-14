'use strict';

function list (api, appId, orgaId) {
  const params = orgaId ? [orgaId, appId] : [appId];
  return api.owner(orgaId).applications._.env.get().withParams(params).send();
};

function listFromAddons (api, appId, orgaId) {
  const params = orgaId ? [orgaId, appId] : [appId];
  return api.owner(orgaId).applications._.addons.env.get().withParams(params).send();
};

function listFromDependencies (api, appId, orgaId) {
  const params = orgaId ? [orgaId, appId] : [appId];
  return api.owner(orgaId).applications._.dependencies.env.get().withParams(params).send();
};

function set (api, name, value, appId, orgaId) {
  const params = orgaId ? [orgaId, appId, name] : [appId, name];
  const payload = JSON.stringify({ value });
  return api.owner(orgaId).applications._.env._.put().withParams(params).send(payload);
};

function remove (api, name, appId, orgaId) {
  const params = orgaId ? [orgaId, appId, name] : [appId, name];
  return api.owner(orgaId).applications._.env._.delete().withParams(params).send();
};

function bulkSet (api, vars, appId, orgaId) {
  const params = orgaId ? [orgaId, appId] : [appId];
  const payload = JSON.stringify(vars);
  return api.owner(orgaId).applications._.env.put().withParams(params).send(payload);
};

module.exports = { list, listFromAddons, listFromDependencies, set, remove, bulkSet };
