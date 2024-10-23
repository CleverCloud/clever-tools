import * as cfg from './config.js';
import { exec } from './utils.js';

export async function publishNpm () {

  const npmToken = cfg.getNpmToken();

  await exec('npm config set registry \'https://registry.npmjs.com/\'');
  await exec(`npm config set '//registry.npmjs.com/:_authToken' '${npmToken}'`);
  await exec('npm publish --tag latest');
};
