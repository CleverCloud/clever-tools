'use strict';

const cfg = require('./config');
const { exec } = require('./utils');

async function run () {
  const isStableVersion = cfg.isStableVersion();
  const npmToken = cfg.getNpmToken();
  const npmTag = isStableVersion ? 'latest' : 'beta';

  exec(`npm config set registry 'https://registry.npmjs.com/'`);
  exec(`npm config set '//registry.npmjs.com/:_authToken' '${npmToken}'`, null, `npm config set '//registry.npmjs.com/:_authToken' 'secret-token'`);
  exec(`npm publish --tag ${npmTag}`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
