'use strict';

function getCurrent (api) {
  return api.self.get().send();
};

function getCurrentId (api) {
  return api.self.get().send().map((self) => self.id);
};

module.exports = { getCurrent, getCurrentId };
