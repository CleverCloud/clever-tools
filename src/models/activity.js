'use strict';

function list (api, appId, orgaId, showAll) {
  const params = [appId];
  if (orgaId) {
    params.unshift(orgaId);
  }
  const query = showAll ? {} : { limit: 10 };

  return api.owner(orgaId).applications._.deployments.get()
    .withParams(params)
    .withQuery(query)
    .send();
};

module.exports = { list };
