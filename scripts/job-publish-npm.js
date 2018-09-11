'use strict';

const cfg = require('./config');
const { exec } = require('./utils');

async function run () {
  const isStableVersion = cfg.isStableVersion();
  const npmToken = cfg.getNpmToken();
  const npmTag = isStableVersion ? 'latest' : 'beta';

  await exec(`npm config set registry 'https://registry.npmjs.com/'`);
  await exec(`npm config set '//registry.npmjs.com/:_authToken' '${npmToken}'`);
  await exec(`npm publish --tag ${npmTag}`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
