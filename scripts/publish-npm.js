import { cfg } from './config';
import { exec } from './utils';

export async function publishNpm () {

  const npmToken = cfg.getNpmToken();

  await exec('npm config set registry \'https://registry.npmjs.com/\'');
  await exec(`npm config set '//registry.npmjs.com/:_authToken' '${npmToken}'`);
  await exec('npm publish --tag latest');
};
