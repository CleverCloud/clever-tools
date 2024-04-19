const Application = require('./application.js');
const organisation = require('@clevercloud/client/cjs/api/v2/organisation.js');
const { sendToApi } = require('./send-to-api.js');
const { autocomplete } = require('cliparse');

async function getNamespaces (ownerId) {
  return organisation.getNamespaces({ id: ownerId }).then(sendToApi);
}

async function completeNamespaces () {
  // Sadly we do not have access to current params in complete as of now
  const { ownerId } = await Application.resolveId(null, null);

  return getNamespaces(ownerId).then(autocomplete.words);
}

module.exports = {
  getNamespaces,
  completeNamespaces,
};
