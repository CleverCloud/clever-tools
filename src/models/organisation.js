'use strict';

const _ = require('lodash');
const Bacon = require('baconjs');

function getId (api, orgaIdOrName) {
  if (orgaIdOrName == null) {
    return Bacon.once(null);
  }

  if (orgaIdOrName.orga_id) {
    return Bacon.once(orgaIdOrName.orga_id);
  }

  return getByName(api, orgaIdOrName.orga_name)
    .map((orga) => orga.id);
}

function getByName (api, name) {

  return api.summary.get().send()
    .map('.organisations')
    .flatMapLatest((orgs) => {
      const filtered_orgs = _.filter(orgs, { name });
      if (filtered_orgs.length === 1) {
        return Bacon.once(filtered_orgs[0]);
      }
      else if (filtered_orgs.length === 0) {
        return Bacon.once(new Bacon.Error('Organisation not found'));
      }
      else {
        return Bacon.once(new Bacon.Error('Ambiguous organisation name'));
      }
    });
}

module.exports = {
  getId,
  getByName,
};
